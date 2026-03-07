Vue.component('card-component', {
    props: ['cardData', 'isBlocked'],
    data () {
        return {
            completedIndexes: []
        }
    },
    computed: {
        completionPercentage() {
            if (this.cardData.items.length === 0)
                return 0
            return (this.completedIndexes.length / this.cardData.items.length) * 100
        }
    },
    watch: {
        completionPercentage (newVal) {
            this.$emit('percentage-changed', {
                cardId: this.cardData.id,
                percentage: newVal
            })
            if (newVal > 50 && this.cardData.column === 1) {
                this.$emit('move-to-column', {cardId: this.cardData.id, column: 2})
            }
            if (newVal === 100 && this.cardData.column === 2) {
                this.$emit('move-to-column', {cardId: this.cardData.id, column: 3})
                this.$emit('set-completion-date', this.cardData.id)
            }
        }
    },
    methods: {
        toggleItem(index) {
            if (this.completedIndexes.includes(index)) {
                this.completedIndexes = this.completedIndexes.filter(i => i !== index)
            } else {
                this.completedIndexes.push(index)
            }
        },
        isCompleted(index) {
            return this.completedIndexes.includes(index)
        }
    },
    template: `
        <div class="card">
            <h3> {{ cardData.title }} </h3>
            <ul>
                <li v-for="(item, index) in cardData.items" :key="index">
                    <label>
                        <input type="checkbox"
                        @change="toggleItem(index)"
                        :checked="isCompleted(index)"
                        :disabled="isBlocked">
                        {{ item }}
                    </label>
                </li>
            </ul>  
        </div>
    `
})

Vue.component('column-component', {
    props: ['columnId', 'allCards', 'isBlocked'],
    template: `
        <div class="column" :class="columnClass">
            <h2> {{ columnTitle }} </h2>
            
            <card-component
                v-for="card in columnCards"
                :key="card.id"
                :card-data="card"
                :is-blocked="isBlocked"
                @move-to-column="$emit('move-to-column', $event)"
                @set-completion-date="$emit('set-completion-date', $event)"
                @percentage-changed="$emit('percentage-changed', $event)">
            </card-component>
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
    props: ['allCards'],
    data () {
        return {
            title: '',
            itemsInput: '',
            error: ''
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

            if (itemsList.length < 3) {
                this.error = 'Minimum of 3 points'
                return
            }

            if (itemsList.length > 5) {
                this.error = 'Maximum of 5 points'
                return
            }

            const cardsInFirstColumn = this.allCards.filter(
                card => card.column === 1).length

            if (cardsInFirstColumn >= 3) {
                this.error = 'Maximum 3 cards in first column'
                return
            }

            const cardsInColumn = this.allCards.filter(
                card => card.column === 1).length

            const newCard = {
                id: Math.random(),
                title: this.title,
                items: itemsList,
                column: 1
            }

            this.$emit('card-created', newCard)

            this.title = ''
            this.itemsInput = ''
            this.error = ''
        }
    },
    template: `
        <div class="add-form">
            <h3>Create new card</h3>
            
            <div class="form-group">
                <label>Title:</label>
                <input type="text" v-model="title" placeholder="Buy products">
            </div>
            
            <div class="form-group">
                <label>Points:</label>
                <textarea 
                    v-model="itemsInput" 
                    placeholder="Milk, Apple, Pineapple"
                    rows="3">    
                </textarea>
                <p>Minimum 3, maximum 5 points</p>
            </div>
            
            <div v-if="error" class="error">
                {{ error }}
            </div>
            
            <button @click="addCard">Create card</button>
        </div>
    `
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
        isFirstColumnBlocked: false,
        cardPercentages: {}
    },
    methods: {
        addCard(cardData) {
            this.allCards.push(cardData)
            this.checkBlocking()
        },
        moveCardToColumn(cardInfo) {
            const foundCard = this.allCards.find(card => card.id === cardInfo.cardId)
            if (!foundCard) return

            if (cardInfo.column === 2) {
                const cardsInSecondColumn = this.allCards.filter(
                    card => card.column === 2).length

                if (cardsInSecondColumn >= 5) {
                    alert('There are a maximum of 5 cards in the second column. Complete one card in the second column first.')
                    return
                }
            }

            foundCard.column = cardInfo.column
            this.checkBlocking()
        },
        setCompletionDate (cardId) {
            const foundCard = this.allCards.find(card => card.id === cardId)
            if (foundCard) {
                foundCard.completedAt = new Date().toLocaleString()
            }
        },
        checkBlocking() {
            const cardsInSecond = this.allCards.filter(
                card => card.column === 2).length

            const hasCardOver50 = this.allCards.some(card =>
            card.column === 1 && this.cardPercentages[card.id] > 50)

            this.isFirstColumnBlocked = cardsInSecond >= 5 && hasCardOver50
        },
        updatePercentage(data) {
            this.cardPercentages[data.cardId] = data.percentage
            this.checkBlocking()
        }
    }
})