import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import { Typography, Grid, Box, Rating, Button } from "@mui/material";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReplayIcon from "@mui/icons-material/Replay";
import SecurityIcon from "@mui/icons-material/Security";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import { grey } from "@mui/material/colors";
import "./MainHomeContent.css";

export default function MainHomeContent() {
    const images: string[] = [
        "iphone1.png",
        "iphone2.png",
        "iphone3.png",
        "iphone4.png",
        "iphone1.png",
        "iphone2.png",
        "iphone3.png",
        "iphone4.png",
        "iphone1.png",
        "iphone2.png",
        "iphone3.png",
        "iphone4.png",
    ];

    const servises = [
        {
            id: 1,
            icon: (
                <SupportAgentIcon
                    sx={{ width: "40px", height: "40px", color: "#0163d2" }}
                />
            ),
            h3: "Customer Servcies",
            span: "Top notch customer service.",
        },
        {
            id: 2,
            icon: (
                <StorefrontIcon
                    sx={{ width: "40px", height: "40px", color: "#0163d2" }}
                />
            ),
            h3: "Pickup At Any Store",
            span: "Free shipping on orders over $65.",
        },
        {
            id: 3,
            icon: (
                <ReplayIcon sx={{ width: "40px", height: "40px", color: "#0163d2" }} />
            ),
            h3: "Free Returns",
            span: "30-days free return policy.",
        },
        {
            id: 4,
            icon: (
                <SecurityIcon
                    sx={{ width: "40px", height: "40px", color: "#0163d2" }}
                />
            ),
            h3: "Secured Payment",
            span: "We accept all major credit cards.",
        },
    ];

    type Collect = {
        id: number;
        image: string;
        price: number;
        priceDeleted: number;
        description: string;
        rating: number;
    };

    const ourColliction: Collect[] = [
        {
            id: 0,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 1,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 2,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 3,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 4,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 5,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 6,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 7,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 8,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 9,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 10,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
        {
            id: 11,
            image: "mouse.jpg",
            price: 35,
            priceDeleted: 48,
            description: "Powermatic 900 W Juicer",
            rating: 4,
        },
    ];
    return (
        <>

            {/* start header */}
            <Swiper effect={"coverflow"} grabCursor={true} centeredSlides={true} loop={true} slidesPerView={"auto"} autoplay={{ delay: 2500, disableOnInteraction: false }} coverflowEffect={{ rotate: 50, stretch: 0, depth: 100, modifier: 1, slideShadows: true, }} pagination={true} modules={[EffectCoverflow, Pagination, Autoplay]} className="w-full py-12 " >
                {images.map((image, index) => {
                    return (
                        <SwiperSlide key={index} className="bg-center bg-cover w-72 h-72">
                            <img className="block w-full" src={image} alt={image} />
                        </SwiperSlide>
                    );
                })}
            </Swiper>
            {/* end header */}

            {/* start service-section */}
            <Typography component="section" sx={{ textAlign: "center", position: "relative", my: "3rem" }} >
                <Grid container spacing={2}>
                    {servises.map((ele) => (
                        <Grid xs={12} sm={6} md={3} sx={{ display: "flex", flexDirection: "row", justifyContent: "center", }} key={ele.id} >
                            <Box sx={{ width: "40px", height: "40px" }}>{ele.icon}</Box>

                            <Box className="mx-4 my-2">
                                <Typography variant="h3" sx={{ fontSize: "1.2rem" }}> {ele.h3} </Typography>
                                <Typography component="span" color="text.secondary" sx={{ fontSize: ".9rem" }} > {ele.span} </Typography>
                            </Box>

                        </Grid>
                    ))}
                </Grid>
            </Typography>
            {/* end service-section */}

            {/* start Rewarded */}
            <Typography component="section" sx={{ textAlign: "center", my: "2rem" }}>
                <div className="container">
                    <Grid container spacing={2}>

                        <Grid item xs={12} sm={6} lg={4}>
                            <div className="grid w-full h-full place-items-center headphone2">
                                <div className="bg-[rgba(35,35,35,.93)] text-white py-8 px-14 my-14">
                                    <Typography component="h2" className="text-[calc(22px+6*(100vw-320px)/1600)] " > Headphone </Typography>
                                    <Typography component="span" className="text-xs"> BUY ONE GET ONE FREE </Typography>
                                </div>
                            </div>
                        </Grid>

                        <Grid item xs={12} lg={4} sx={{ order: { lg: 0, sm: 1, xs: 0 } }}>
                            <Box sx={{ padding: "40px", background: grey[200], textAlign: "center", height: "100%", }} >
                                <Typography component="h6" sx={{ fontSize: "calc(13px + 1*(100vw-320px)/1600)", fontWeight: 400, }} className="text-main-color mb-[.5rem]" > Get Rewarded </Typography>
                                <Typography component="h2" sx={{ textTransform: "capitalize", fontSize: "calc(22px + 6*(100vw - 320px)/1600)", fontWeight: 600, }} > Earn 10% </Typography>
                                <Typography component="h2" sx={{ textTransform: "capitalize", fontSize: "calc(22px + 6*(100vw - 320px)/1600)", fontWeight: 600, }} > Back Reward </Typography>
                                <Typography component="p" sx={{ marginTop: ".5rem", fontSize: "calc(13px + 1*(100vw - 320px)/1600)", marginBottom: "1rem", }} > Valid online & in-store with select styles. </Typography>
                                <Button variant="contained" className="bg-main-color">Learn more</Button>
                            </Box>
                        </Grid>

                        <Grid item xs={12} sm={6} lg={4}>
                            <div className="grid w-full h-full place-items-center headphone1">
                                <div className="bg-[rgba(35,35,35,.93)] text-white py-8 px-14 my-14">
                                    <Typography component="h2" className="text-[calc(22px+6*(100vw-320px)/1600)] " > Headphone </Typography>
                                    <Typography component="span" className="text-xs">BUY ONE GET ONE FREE</Typography>
                                </div>
                            </div>
                        </Grid>

                    </Grid>
                </div>
            </Typography>
            {/* end Rewarded */}

            {/* start Our Collection */}
            <Typography component="section" sx={{ my: "3rem" }}>
                <Typography component="h2" sx={{ textAlign: "center", fontSize: "1.5rem", fontWeight: "700" }} > Our Collection </Typography>

                <Typography component="h2" sx={{ textAlign: "center" }} color="text.secondary" > Just For You </Typography>

                <Swiper grabCursor={true} centeredSlides={true} spaceBetween={30} loop={true} autoplay={{ delay: 3500, disableOnInteraction: false }} pagination={{ clickable: true }} modules={[Autoplay, Pagination]} className="w-full my-12" height={11} breakpoints={{ 430: { slidesPerView: 2 }, 700: { slidesPerView: 3 }, 990: { slidesPerView: 4 }, 1200: { slidesPerView: 5 }, }} slidesPerView={1} >
                    {ourColliction.map((ele) => {
                        return (
                            <SwiperSlide key={ele.id} className="pb-10 bg-center bg-cover">

                                <img className="block w-full h-full " src={ele.image} alt={ele.image} />

                                <div className="flex justify-center w-full gap-1 ">
                                    <span className="bg-white p-[6px] rounded-md hover:bg-main-color hover:text-white duration-300"> <FavoriteBorderIcon /> </span>
                                    <span className="bg-white p-[6px] rounded-md hover:bg-main-color hover:text-white duration-300"> <VisibilityIcon /> </span>
                                    <span className="bg-white p-[6px] rounded-md hover:bg-main-color hover:text-white duration-300"> <AddShoppingCartIcon /> </span>
                                </div>

                                <div className="my-2 font-bold text-center text-main-color">F${ele.price}.00F<span className="text-[#7e7e7e] text-sm line-through ">${ele.priceDeleted}.00</span></div>

                                <p className="font-medium text-center">{ele.description}</p>

                                <Rating name="half-rating-read" defaultValue={2.5} precision={0.5} readOnly sx={{ display: "flex", justifyContent: "center" }} />

                            </SwiperSlide>
                        );
                    })}
                </Swiper>
            </Typography>
            {/* end Our Collection */}

            {/* start counter */}
            <Typography component="section" className="my-12">
                <div className="container">

                    <Grid container spacing={2}>

                        <Grid item xs={12} md={8} lg={9}>
                            <div className="relative flex items-center justify-center w-full h-full text-white liftCounter ">
                                <ul className="bg-[rgba(35,35,35,.8)] w-3/5 list-none flex justify-center items-center py-7 my-28">
                                    <li className="px-5 text-center"> <div>Days</div> <div>0</div> </li>
                                    <li className="text-center border-x-[1px] border-solid border-white px-5"> <div>Hours</div> <div>0</div> </li>
                                    <li className="text-center px-5 border-e-[1px] border-solid border-white"> <div>Min</div> <div>0</div> </li>
                                    <li className="px-5 text-center "> <div>Sec</div> <div>0</div> </li>
                                </ul>
                                <Button variant="contained" className="absolute bottom-0 left-0 bg-main-color">Shop Now</Button>
                            </div>
                        </Grid>

                        <Grid item xs={12} md={4} lg={3}>
                            <div className="w-full h-full py-12 text-center rightCounter">
                                <h6 className="mb-2 text-main-color text-[calc(13px + 1*(100vw-320px)/1600)] font-normal">New Headphone</h6>
                                <h2 className="text-[calc(22px+6*(100vw-320px)/1600)] font-semibold">50% Cash</h2>
                                <h2 className="text-[calc(22px+6*(100vw-320px)/1600)] font-semibold">Back Reward</h2>
                                <p className="my-2  text-[#7e7e7e] text-[calc(13px + 1*(100vw - 320px)/1600)]">Limited Offer</p>
                                <p className="my-2  text-[#7e7e7e] text-[calc(13px + 1*(100vw - 320px)/1600)]">Buy Now!!</p>
                                <Button variant="contained" className="bg-main-color">Shop Now</Button>
                            </div>
                        </Grid>

                    </Grid>

                </div>
            </Typography>
            {/* end counter */}

        </>
    );
}
