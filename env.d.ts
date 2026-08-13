declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT: string;
            NEXT_PUBLIC_API_URL: string;
            NEXT_PUBLIC_API_KEY: string;
        }
    }
}

export {};