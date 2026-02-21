import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                checkout: resolve(__dirname, 'checkout.html'),
                thankyou: resolve(__dirname, 'thank-you.html'),
                admin: resolve(__dirname, 'admin.html'),
            },
        },
    },
})
