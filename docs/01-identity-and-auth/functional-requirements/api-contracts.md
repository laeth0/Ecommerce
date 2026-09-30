# Identity API Contracts

**Status:** proposed Phase 01 external contract. Base path `/api/v1`. This is a first-party login API, not an OAuth authorization server. [Workflows](identity-workflows.md) own business behavior; [security](../security/threat-model-and-controls.md) owns JWT validation.

## 1. Protocol rules

- HTTPS is required, including a trusted development certificate. No credential is accepted through a URL/query string or cookie.
- POST bodies use `Content-Type: application/json`. JSON success bodies use that media type; errors use `application/problem+json`; `204` has no body or Content-Type.
- All identity responses include `Cache-Control: no-store` and `Pragma: no-cache`. Token responses never set an authentication cookie.
- Maximum decoded request body is 4,096 bytes; reject compressed request bodies. Access JWTs are limited to 8,192 bytes. Exceeding body size yields `413`; oversized/invalid credentials yield the endpoint's generic credential error.
- Protected routes require one `Authorization: Bearer <accessToken>` header. Public credential routes derive authority only from their declared body; an Authorization header there does not change the actor or requested operation.
- No endpoint accepts query parameters; an unexpected parameter is `400 Validation.Failed`. GET has no request body. Unknown JSON members and duplicate keys are rejected. Empty body means missing input, not an empty object.
- Dates are UTC RFC 3339 strings ending in `Z`; UUIDs are lowercase canonical strings. JSON member names and enum values are case-sensitive.
- Each response includes `X-Request-Id`, a server-generated canonical UUID. The same value appears as `traceId` in a problem body. Do not reflect unvalidated client correlation strings.
- Rate-limit responses include integer `Retry-After` seconds, rounded up to the latest applicable counter window boundary, minimum 1. Dependency/capacity `503` responses include `Retry-After: 1`; this header does not make credential issuance safe to replay after an unknown commit.

## 2. Endpoint matrix

Schema names reference the JSON Schema registry below. All endpoints may return the common protocol, capacity, and dependency errors in section 4.

| Method and path | Credential/authorization | Request schema | Success schema/status | Domain errors |
| --- | --- | --- | --- | --- |
| `POST /api/v1/auth/register` | Anonymous | `RegisterRequest` | `202 AcceptedResponse` | `400 Validation.Failed` |
| `POST /api/v1/auth/login` | Anonymous password verification; Admin source restriction | `LoginRequest` | `200 TokenResponse` | `401 Auth.InvalidCredentials`; `409 Auth.SessionLimitReached` |
| `POST /api/v1/auth/refresh` | Refresh secret; Admin source restriction | `RefreshRequest` | `200 TokenResponse` | `401 Auth.InvalidRefreshToken` |
| `POST /api/v1/auth/logout` | Refresh secret; revocation only | `RefreshRequest` | `204`, including unknown/already revoked secret | `400 Validation.Failed` for malformed token syntax |
| `GET /api/v1/users/me` | Eligible Bearer access; Admin source restriction when applicable | None | `200 UserResponse` | `401 Auth.Unauthorized`; `403 Auth.Forbidden` |
| `GET /api/v1/admin/users/{userId}` | Eligible Bearer access, Admin role, allowed source network | Path `userId`: `Uuid` | `200 AdminUserResponse` | `401 Auth.Unauthorized`; `403 Auth.Forbidden`; `404 User.NotFound` |

The Admin endpoint authorizes before looking up its target. After authorization, an invalid UUID is `400 Validation.Failed`; a well-formed absent UUID is `404 User.NotFound`. Other unsupported identity routes return `404 Route.NotFound`; unsupported methods on existing routes return `405 Method.NotAllowed` with `Allow` listing supported methods. There are no reset-password, verify-email, MFA, role-edit, or public provisioning routes.

`RegisterRequest` and `LoginRequest` share a wire shape but have different password-policy validation, as specified in the workflows. Register always returns the fixed message, without user identifiers or credentials. A TokenResponse reports the newly issued access expiry and successor refresh expiry; `sessionExpiresAt` is the original absolute deadline. Its `user` fields come from the current authoritative user record.

## 3. JSON Schema registry

Each named schema is independently addressable by `#/$defs/<name>`. JSON Schema validates structure; normalized-email rules, Unicode scalar/byte counts, blocklist policy, and canonical token decoding in the workflows are additional required semantic validation. Unknown properties are forbidden on every object.

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "urn:ecommerce:identity:schemas:v1",
  "$defs": {
    "Uuid": {
      "type": "string", "format": "uuid",
      "pattern": "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$"
    },
    "UtcInstant": { "type": "string", "format": "date-time", "pattern": "Z$" },
    "EmailInput": { "type": "string", "minLength": 3, "maxLength": 256 },
    "PasswordInput": { "type": "string", "minLength": 1, "maxLength": 256, "writeOnly": true },
    "RefreshToken": {
      "type": "string", "minLength": 43, "maxLength": 43,
      "pattern": "^[A-Za-z0-9_-]{43}$"
    },
    "RegisterRequest": {
      "type": "object", "additionalProperties": false, "required": ["email", "password"],
      "properties": {
        "email": { "$ref": "#/$defs/EmailInput" },
        "password": { "$ref": "#/$defs/PasswordInput" }
      }
    },
    "LoginRequest": {
      "type": "object", "additionalProperties": false, "required": ["email", "password"],
      "properties": {
        "email": { "$ref": "#/$defs/EmailInput" },
        "password": { "$ref": "#/$defs/PasswordInput" }
      }
    },
    "RefreshRequest": {
      "type": "object", "additionalProperties": false, "required": ["refreshToken"],
      "properties": { "refreshToken": { "$ref": "#/$defs/RefreshToken", "writeOnly": true } }
    },
    "AcceptedResponse": {
      "type": "object", "additionalProperties": false, "required": ["message"],
      "properties": { "message": { "const": "Registration request accepted. You may try to log in." } }
    },
    "UserResponse": {
      "type": "object", "additionalProperties": false,
      "required": ["id", "email", "role", "createdAt"],
      "properties": {
        "id": { "$ref": "#/$defs/Uuid" },
        "email": { "type": "string", "minLength": 3, "maxLength": 254 },
        "role": { "enum": ["Customer", "Admin"] },
        "createdAt": { "$ref": "#/$defs/UtcInstant" }
      }
    },
    "AdminUserResponse": {
      "type": "object", "additionalProperties": false,
      "required": ["id", "email", "role", "createdAt", "status"],
      "properties": {
        "id": { "$ref": "#/$defs/Uuid" },
        "email": { "type": "string", "minLength": 3, "maxLength": 254 },
        "role": { "enum": ["Customer", "Admin"] },
        "createdAt": { "$ref": "#/$defs/UtcInstant" },
        "status": { "enum": ["Active", "Disabled"] }
      }
    },
    "TokenResponse": {
      "type": "object", "additionalProperties": false,
      "required": ["accessToken", "tokenType", "expiresIn", "accessTokenExpiresAt", "refreshToken", "refreshTokenExpiresAt", "sessionId", "sessionExpiresAt", "user"],
      "properties": {
        "accessToken": { "type": "string", "minLength": 20, "maxLength": 8192 },
        "tokenType": { "const": "Bearer" },
        "expiresIn": { "type": "integer", "minimum": 1, "maximum": 300 },
        "accessTokenExpiresAt": { "$ref": "#/$defs/UtcInstant" },
        "refreshToken": { "$ref": "#/$defs/RefreshToken" },
        "refreshTokenExpiresAt": { "$ref": "#/$defs/UtcInstant" },
        "sessionId": { "$ref": "#/$defs/Uuid" },
        "sessionExpiresAt": { "$ref": "#/$defs/UtcInstant" },
        "user": { "$ref": "#/$defs/UserResponse" }
      }
    },
    "FieldError": {
      "type": "object", "additionalProperties": false, "required": ["field", "code"],
      "properties": {
        "field": { "enum": ["body", "email", "password", "refreshToken", "userId", "query"] },
        "code": { "enum": ["Required", "InvalidFormat", "OutOfRange", "UnknownMember", "DuplicateMember", "WeakPassword"] }
      }
    },
    "Problem": {
      "type": "object", "additionalProperties": false,
      "required": ["type", "title", "status", "detail", "instance", "code", "traceId"],
      "properties": {
        "type": { "type": "string", "format": "uri" },
        "title": { "type": "string", "minLength": 1, "maxLength": 80 },
        "status": { "enum": [400, 401, 403, 404, 405, 409, 413, 415, 429, 500, 503] },
        "detail": { "type": "string", "minLength": 1, "maxLength": 200 },
        "instance": { "type": "string", "pattern": "^/api/v1/", "maxLength": 256 },
        "code": { "enum": ["Validation.Failed", "Auth.InvalidCredentials", "Auth.InvalidRefreshToken", "Auth.Unauthorized", "Auth.Forbidden", "Auth.SessionLimitReached", "User.NotFound", "Route.NotFound", "Method.NotAllowed", "Request.TooLarge", "Request.UnsupportedMediaType", "RateLimit.Exceeded", "Service.Unavailable", "Server.Error"] },
        "traceId": { "$ref": "#/$defs/Uuid" },
        "errors": { "type": "array", "minItems": 1, "maxItems": 10, "items": { "$ref": "#/$defs/FieldError" } }
      }
    }
  }
}
```

Email/password wire limits bound work before normalization; semantic limits still apply afterward. `expiresIn` is `exp - iat` for the issued JWT. `exp` is capped by the current session deadlines, so it may be less than 300 seconds near absolute expiry. Do not issue credentials with less than one whole second of remaining eligibility.

## 4. Error catalog and precedence

Use [RFC 9457 Problem Details](https://www.rfc-editor.org/rfc/rfc9457) with these fixed strings. `type` is `urn:ecommerce:problem:` followed by the exact code, `instance` is the matched route template without query values, and `traceId` is the server request ID. For an unmatched route use `/api/v1/unknown` to avoid reflecting attacker input.

| Status/code | Title | Detail |
| --- | --- | --- |
| 400 `Validation.Failed` | Invalid request | The request does not match the identity contract. |
| 401 `Auth.InvalidCredentials` | Authentication failed | The credentials could not be accepted. |
| 401 `Auth.InvalidRefreshToken` | Invalid refresh credential | Log in again to obtain credentials. |
| 401 `Auth.Unauthorized` | Authentication required | A valid access credential is required. |
| 403 `Auth.Forbidden` | Access denied | This operation is not permitted. |
| 409 `Auth.SessionLimitReached` | Session limit reached | Log out an existing session or contact the sandbox operator. |
| 404 `User.NotFound` | User not found | The requested user was not found. |
| 404 `Route.NotFound` | Route not found | The requested route was not found. |
| 405 `Method.NotAllowed` | Method not allowed | The HTTP method is not supported for this route. |
| 413 `Request.TooLarge` | Request too large | The request exceeds the allowed size. |
| 415 `Request.UnsupportedMediaType` | Unsupported request format | Use an uncompressed application/json request body. |
| 429 `RateLimit.Exceeded` | Request limit reached | Retry after the indicated delay. |
| 503 `Service.Unavailable` | Service unavailable | The operation could not be completed. Follow the documented recovery procedure. |
| 500 `Server.Error` | Unexpected server error | The operation could not be completed. |

Only `Validation.Failed` includes `errors`: up to ten entries sorted by field then code; use `body` for malformed JSON/unknown members. Never include submitted values. All `401` responses include `WWW-Authenticate: Bearer` without detailed token failure information.

Processing order is transport/size/media parsing → valid JSON shape and semantic input → shared admission → credential validation → role/network permission → target lookup → domain transaction. Protected endpoints validate Bearer authority before revealing target validation/existence. Malformed refresh syntax on refresh returns the generic `401 Auth.InvalidRefreshToken`; the same malformed syntax on logout is `400` because logout's unknown-valid-secret result is already `204`. Non-token structural errors remain `400` on both.

An unexpected exception produces sanitized `500`; known dependency, transaction-deadline, signing, audit, and hash-capacity failures produce `503`. A transaction whose commit status is unknown MUST NOT be reported as a successful login/refresh or blindly retried.
