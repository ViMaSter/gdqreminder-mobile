import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'

const app = createApp(App)
const pinia = createPinia();
app.use(pinia);

watch(
    pinia.state,
    (state) => {
        localStorage.setItem('piniaState', JSON.stringify(state))
    },
    { deep: true }
)

app.mount('#app')
