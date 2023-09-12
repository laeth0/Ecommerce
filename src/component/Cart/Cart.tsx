import { Typography, Button, Card, CardActions, CardContent, CardMedia, Box } from '@mui/material'
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import { grey } from '@mui/material/colors';
import DeleteIcon from '@mui/icons-material/Delete';

export default function Cart() {
    return (
        <div className="">
            <div className="container flex flex-col md:flex-row py-7 gap-6">

                <Box sx={{ display: "flex", flexDirection: "column", height: "fit-content", gap: "1rem" }}>
                    <Typography variant="body1" color="blue" fontWeight="800" fontSize="1.25rem" > My cart</Typography>

                    <Card>

                        <CardContent>
                            <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: "0.75rem", justifyContent: "space-between" }}>

                                <Box sx={{ display: "flex", flexDirection: "row", gap: "1.5rem", justifyContent: "center", alignItems: "center" }}>
                                    <CardMedia sx={{ width: "7rem", height: "7rem" }} component="img" image="https://static.netshoes.com.br/produtos/tenis-adidas-coreracer-masculino/09/NQQ-4635-309/NQQ-4635-309_zoom1.jpg?ts=1675445414&ims=544x" alt="Paella dish" />
                                    <Box>
                                        <Typography sx={{ fontSize: "1.125rem", color: grey[800], fontWeight: "600" }} variant="body1">Adidas Coreracer Men's Shoes</Typography>
                                        <Typography sx={{ fontSize: ".75rem", color: grey[600], fontWeight: "600" }} variant="body1">Color: <span className="font-normal">Black + Zinc</span></Typography>
                                        <Typography sx={{ fontSize: ".75rem", color: grey[600], fontWeight: "600" }} variant="body1">Size: <span className="font-normal">42</span></Typography>
                                    </Box>
                                </Box>

                                <Button sx={{ color: "black" }} >  <DeleteIcon />  </Button>

                            </Box>

                        </CardContent>

                        <CardActions sx={{ display: "flex", flexDirection: "row", justifyContent: "center", gap: "0.3rem" }}>
                            <Button variant="text" color="primary" sx={{ widows: "1.25rem", height: "1.25rem", borderRadius: "50%", border: "1px solid rgb(209, 213 ,219)", minWidth: "0", padding: "0" }} >
                                <RemoveIcon sx={{ color: "gray" }} />
                            </Button>

                            <input type="text" readOnly={true} defaultValue={1} className="w-8 h-8 text-center text-gray-900 text-sm outline-none border border-gray-300 rounded-sm" />

                            <Button variant="text" color="primary" sx={{ widows: "1.25rem", height: "1.25rem", margin: "0px !important", borderRadius: "50%", border: "1px solid rgb(209, 213 ,219)", minWidth: "0", padding: "0" }} >
                                <AddIcon sx={{ color: "gray" }} />
                            </Button>
                        </CardActions>

                    </Card>

                </Box>

                <div className="flex flex-col w-full md:w-2/3 h-fit gap-4 ">

                    <p className="text-blue-900 text-xl font-extrabold">Purchase Resume</p>
                    <div className="flex flex-col p-4 gap-4 text-lg font-semibold shadow-md border rounded-sm">
                        <div className="flex flex-row justify-between">
                            <p className="text-gray-600">Subtotal (2 Items)</p>
                            <p className="text-end font-bold">$99.98</p>
                        </div>
                        <hr className="bg-gray-200 h-0.5" />
                        <div className="flex flex-row justify-between">
                            <p className="text-gray-600">Freight</p>
                            <div>
                                <p className="text-end font-bold">$3.90</p>
                                <p className="text-gray-600 text-sm font-normal">Arrives on Jul 16</p>
                            </div>
                        </div>
                        <hr className="bg-gray-200 h-0.5" />
                        <div className="flex flex-row justify-between">
                            <p className="text-gray-600">Discount Coupon</p>
                            <a className="text-gray-500 text-base underline" href="#">Add</a>
                        </div>
                        <hr className="bg-gray-200 h-0.5" />
                        <div className="flex flex-row justify-between">
                            <p className="text-gray-600">Total</p>
                            <div>
                                <p className="text-end font-bold">$103.88</p>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-between">
                            <Button variant='outlined' >FINISH</Button>
                            <Button variant='outlined'> ADD MORE PRODUCTS</Button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
