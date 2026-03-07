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
    props: ['columnID', 'allCards'],
    template: `
        <div class="column" :class="columnClass">
            <h2> {{ columnTitle }} </h2>
            
            <card-component
                v-for="card in columnСards"
                :key="card.id"
                :card-data="card">
            </card-component>
            
            <button class="add-card-button" 
            @click="$emit('add-click', columnId)">Add card</button>
        </div>
    `,
    computed: {
        columnTitle() {
            const titles = {
                1: 'Need to do',
                2: 'In progress',
                3: 'Done',
            }
            return titles[this.columnId]
        },
        columnClass() {
            return {
                'column-first': this.columnId === 1,
                'column-second': this.columnId === 2,
                'column-third': this.columnId === 3
            }
        },
        columnCards() {
            return this.allCards.filter(card => card.column === this.columnId)
        }
    }
})

Vue.component('add-card-form', {
    data () {
        return {
            title: '',
            itemsInput: '',
            error: '',
        }
    },
    methods: {
        addCard() {
            const itemsList = this.itemsInput
                .split(',')
                .map(item=> item.trim())
                .filter(item => item !== '')

            if (!this.title) {
                this.error = 'Enter title'
                return
            }

            if (itemsList.lenght < 3) {
                this.error = 'Minimum of 3 points'
                return
            }

            if (itemsList.length > 5) {
                this.error = 'Maximum of 5 points'
                return
            }

            const newCard = {
                id: this.currentCardsCount + 1,
                title: this.title,
                items: itemsList,
                column: this.columnId
            }
        }
    }
})

let app = new Vue ({
    el: '#app',
    data: {
        columns: [
            {id: 1},
            {id: 2},
            {id: 3}
        ],
        allCards: [],
        activeColumnId: null
    },
    template: `
        <div class="app">
            <h1>My notes</h1>
            <div class="columns-container">
                <column-component 
                v-for="col in columns"
                :key="col.id"
                :column-data="col">
                </column-component>
            </div>
        </div>
    `
})