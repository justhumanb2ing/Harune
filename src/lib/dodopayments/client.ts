import { env } from "@/env";
import DodoPayments from "dodopayments";

const client = new DodoPayments({
  baseURL: env.DODO_PAYMENTS_API_URL!,
  bearerToken: env.DODO_PAYMENTS_API_KEY!,
});

export default client;
