import './utils/polyfill'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dropdown from 'primevue/dropdown'
import Tooltip from 'primevue/tooltip'

import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue)
app.directive('tooltip', Tooltip)

app.component('InputText', InputText)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Button', Button)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Checkbox', Checkbox)
// eslint-disable-next-line vue/multi-word-component-names
app.component('Dropdown', Dropdown)

app.mount('#app')
