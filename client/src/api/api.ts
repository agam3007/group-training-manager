import { env } from "@/env/env";
import axios from "axios";

export const api = axios.create({
  baseURL: env.apiUrl,
});
