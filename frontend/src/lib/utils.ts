/* eslint-disable @typescript-eslint/no-explicit-any */
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const API_URL = typeof window !== 'undefined' && (window as any)?.__ENV__
  ? (window as any)?.__ENV__?.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:6002'
  : process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:6002';

export const API_BASE_URL = `${API_URL}/api`;
export const API_DOMAIN_URL = API_URL;
// console.log('API_BASE_URL utils:', API_BASE_URL);
// console.log('API_DOMAIN_URL utils:', API_DOMAIN_URL);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
