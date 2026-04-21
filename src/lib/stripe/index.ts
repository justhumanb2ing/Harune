import { env } from "@/env";
import stripeClient from "stripe";

const stripe = new stripeClient(env.STRIPE_SECRET_KEY!);

export default stripe;
