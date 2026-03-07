Vue.component('card-component', {
    props: ['cardData'],
    template: `
        <div class="card">
            <h3> {{ cardData.title }} </h3>
            <ul>
                <li v-for="item in cardData.items"> {{ item }} </li>
            </ul>
        </div>
    `
})

Vue.component('column-component', {
    props: ['columnData'],
    template: `
        <div class="column" :class="columnClass">
            <h2> {{ columnTitle }} </h2>
            
            <card-component
                v-for="card in columnData.cards"
                :key="card.id"
                :card-data="card">
            </card-component>
        </div>
    `,
    computed: {
        columnTitle() {
            const titles = {
                col1: 'Need to do',
                col2: 'In progress',
                col3: 'Done',
            }
            return titles[this.columnTitle]
        },
        columnClass() {
            return {
                'column-first': this.columnData.id === 'col1',
                'column-second': this.columnData.id === 'col2',
                'column-third': this.columnData.id === 'col3'
            }
        }
    }
})

let app = new Vue ({
    el: '#app',
    data: {
        columns: [
            {id: 'col1', cards: []},
            {id: 'col2', cards: []},
            {id: 'col3', cards: []},
        ]
    }
})