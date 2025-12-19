/* eslint-disable @typescript-eslint/no-explicit-any */
import toast from 'react-hot-toast';

import { API_BASE_URL } from './utils';
// console.log('API_BASE_URL:', API_BASE_URL);

interface RequestOptions extends RequestInit {
    headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Handle FormData special case: remove Content-Type to let browser set boundary
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
            // Avoid redirect loop if already on login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
                toast.error('Session expired. Please login again.');
            }
        }
        throw new Error('Session expired');
    }

    if (!response.ok) {
        let errorMessage = 'An error occurred';
        try {
            const data = await response.json();
            errorMessage = data.error || response.statusText;
        } catch (e) {
            errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return {} as T;
    }

    try {
        return await response.json();
    } catch (e) {
        // Return empty object if json parse fails but response was ok
        return {} as T;
    }
}

export const api = {
    get: <T>(endpoint: string) => request<T>(endpoint, { method: 'GET' }),
    post: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    postForm: <T>(endpoint: string, formData: FormData) => request<T>(endpoint, { method: 'POST', body: formData }),
    patch: <T>(endpoint: string, body: any) => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
};
