# Reproducible Container Artifacts

## Problem and artifact ownership

A mutable image tag or environment-specific rebuild cannot identify the binary that passed review. Commerce and Payments require independently versioned immutable artifacts with explicit compatible schema/protocol/configuration.

Build each owner image from the exact approved source commit using supported pinned ASP.NET Core/.NET/EF Core/Npgsql10 toolchain and locked package restore. PostgreSQL18, reviewed supported RabbitMQ/OTP/client pair and all platform/diagnostic images have their own pinned digest inventory. No runtime/provider/API version upgrade is implied.

Before implementation, record a supported kind node/Kubernetes/CNI/Gateway API/Envoy Gateway/metrics-server matrix. Pin actual stable versions and API schemas; reject previews or unsupported pairs. A moving official quickstart's latest tag is not a release pin.

## Build contract

1. Resolve approved source/dependency locks and immutable build/base inputs. Exclude credentials, dumps, personal configuration and unrelated files from context.
2. Run established build/format/type/static/schema checks; run existing applicable tests when present. A repository without them records the coverage gap.
3. Build owner images with a multistage SDK→runtime boundary and architecture-specific metadata. No runtime secret is available to the build.
4. Generate dependency/SBOM/provenance inventory linking source, toolchain, inputs and image digest.
5. Run existing approved secret/dependency/container scanning. Reachable high/critical unresolved exposure blocks promotion under the security policy.
6. Publish only through the separately authorized private artifact capability during later implementation. Retain the exact resulting manifest digest; do not rebuild during promotion.

No deterministic bit-identical image claim is made unless repeated builds actually establish it. Controlled inputs and exact promoted digest are required even when metadata makes two rebuilds differ.

Private package-feed access, if needed, uses temporary BuildKit secret mounts, not ARG/ENV/copy layers or output. No build requires Stripe/JWT/database/backup credentials. See [Docker build secrets](https://docs.docker.com/build/building/secrets/).

Microsoft documents [containerizing .NET](https://learn.microsoft.com/en-us/dotnet/core/docker/build-container); actual base-image ports/user/CA/globalization/filesystem behavior must be inspected for the selected image.

## Runtime image policy

Nonroot user, read-only root filesystem, no privilege escalation, dropped capabilities and RuntimeDefault seccomp. Writable temp paths are bounded ephemeral mounts; keys/configuration are read-only protected injection.

No Docker socket, host PID/network namespace, application cluster-admin token, package installer or public debugger. Image-contained probe capability uses the reviewed minimum client and validates management HTTPS; a shell/curl assumption is not sufficient for a minimal image.

Match CPU architecture, timezone/UTC behavior, CA bundle and required database/TLS libraries to the actual host. Never bypass certificate validation because a minimal image lacks trust material.

Container entrypoint propagates SIGTERM to the owner process and implements the original ≤15s drain. Payments API/relay/executor remain in the one original process; no extra executor sidecar or hidden worker service.

## Artifact distribution and retention

The user approved no cloud spend. Select an existing permitted private artifact transport at implementation and verify storage/CI entitlement/cost; a registry brand or private-repository setting does not establish free availability.

A local operator retrieves the approved digest-addressed bundle or protected OCI image archive, verifies digest/provenance and loads it into the intended kind runtime. Do not pass arbitrary caller-supplied URLs through release tooling.

Retain artifacts required for current release, compatible rollback and every retained backup's restore compatibility. CI log/artifact expiration cannot be the only release/backup compatibility inventory.

## Acceptance

Wrong digest/source/architecture, mutable tag, missing CA, leaked secret, tampered provenance, unavailable registry and failed scan block release. Image pull failure preserves containment; it cannot trigger an unreviewed rebuild/tag or start an old writer with incompatible state.

This phase authors no Dockerfile, image, action, SBOM or executable build command. These are implementation contracts.
