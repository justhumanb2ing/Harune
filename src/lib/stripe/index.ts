import stripeClient from "stripe";
import { env } from "@/env";

const stripe = new stripeClient(env.STRIPE_SECRET_KEY!);

export default stripe;
