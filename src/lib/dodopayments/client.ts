import DodoPayments from "dodopayments";
import { env } from "@/env";

const client = new DodoPayments({
  baseURL: env.DODO_PAYMENTS_API_URL!,
  bearerToken: env.DODO_PAYMENTS_API_KEY!,
});

export default client;
