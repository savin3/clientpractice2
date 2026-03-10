Vue.component('card-component', {
    props: ['cardData', 'isBlocked', 'isPriorityBlocked', 'priorityCardId'],
    computed: {
        completionPercentage() {
            if (this.cardData.items.length === 0)
                return 0
            return (this.cardData.completedIndexes.length / this.cardData.items.length) * 100
        }
    },
    watch: {
        completionPercentage (newVal) {
            this.$emit('percentage-changed', {
                cardId: this.cardData.id,
                percentage: newVal
            })

            if (this.cardData.column === 2 && this.cardData.skippedIndexes && this.cardData.skippedIndexes.length > 0) {
                this.$emit('move-to-column', {cardId: this.cardData.id, column: 4})
                return
            }

            if (newVal > 50 && this.cardData.column === 1) {
                this.$emit('move-to-column', {cardId: this.cardData.id, column: 2})
            }
            if (newVal === 100 && this.cardData.column === 2) {
                this.$emit('move-to-column', {cardId: this.cardData.id, column: 3})
                this.$emit('set-completion-date', this.cardData.id)
            }

            if (this.cardData.column === 4 && this.cardData.completedIndexes.length === this.cardData.items.length) {
                this.$emit('move-to-column', {cardId: this.cardData.id, column: 3})
                this.$emit('set-completion-date', this.cardData.id)
            }
        }
    },
    methods: {
        toggleItem(index) {
            this.$emit('toggle-item', {
                cardId: this.cardData.id,
                index: index
            })
        },
        toggleSkip(index) {
            this.$emit('toggle-skip', {
                cardId: this.cardData.id,
                index: index
            })
        },
        isCompleted(index) {
            return this.cardData.completedIndexes.includes(index)
        },
        isSkipped(index) {
            return this.cardData.skippedIndexes && this.cardData.skippedIndexes.includes(index)
        }
    },
    template: `
        <div class="card" :class="{ 'priority-card': cardData.isPriority }">
            <div class="card-header">
                <h3 class="card-title"> {{ cardData.title }} </h3>
                <span v-if="cardData.isPriority" class="priority-badge">Приоритет</span>
            </div>
            
            <ul class="card-items">
                <li v-for="(item, index) in cardData.items" :key="index" class="card-item">
                    <label class="item-label">
                    <input type="checkbox"
                        @change="toggleItem(index)"
                        :checked="isCompleted(index)"
                        :disabled="isBlocked || (isPriorityBlocked && !cardData.isPriority) || 
                        cardData.column === 3 ||
                        isCompleted(index)">
                    <span :class="{ 
                        'completed': isCompleted(index), 
                        'skipped': isSkipped(index) 
                    }">{{ item }}</span>
                </label>
                    
                    <button v-if="cardData.column === 2 && !cardData.isPriority" 
                    @click="toggleSkip(index)"
                    :disabled="isBlocked || (isPriorityBlocked && !cardData.isPriority) || isCompleted(index)"
                    class="skip-button">
                    Skip
                    </button>
                </li>
            </ul>
            
            <div v-if="cardData.completedAt" class="completion-date">
                Done at: {{ cardData.completedAt }}
            </div>  
        </div>
    `
})

Vue.component('column-component', {
    props: ['columnId', 'allCards', 'isBlocked', 'isPriorityBlocked', 'priorityCardId'],
    template: `
        <div class="column" :class="columnClass">
            <h2> {{ columnTitle }} </h2>
            
            <card-component
                v-for="card in columnCards"
                :key="card.id"
                :card-data="card"
                :is-blocked="isBlocked"
                :is-priority-blocked="isPriorityBlocked"
                :priority-card-id="priorityCardId"
                @move-to-column="$emit('move-to-column', $event)"
                @set-completion-date="$emit('set-completion-date', $event)"
                @percentage-changed="$emit('percentage-changed', $event)"
                @toggle-item="$emit('toggle-item', $event)"
                @toggle-skip="$emit('toggle-skip', $event)">
            </card-component>
        </div>
    `,
    computed: {
        columnTitle() {
            const titles = {
                1: 'Need to do',
                2: 'In progress',
                3: 'Done',
                4: 'Refine it'
            }
            return titles[this.columnId]
        },
        columnClass() {
            return {
                'column-first': this.columnId === 1,
                'column-second': this.columnId === 2,
                'column-third': this.columnId === 3,
                'column-fourth': this.columnId === 4
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
            error: '',
            isPriority: false
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

            const newCard = {
                id: Math.random(),
                title: this.title,
                items: itemsList,
                column: 1,
                completedIndexes: [],
                skippedIndexes: [],
                isPriority: this.isPriority
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
            
            <div class="form-group checkbox-group">
                <label>
                <input type="checkbox" v-model="isPriority">
                Priority
                </label>
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
            {id: 3},
            {id: 4}
        ],
        allCards: [],
        isFirstColumnBlocked: false,
        cardPercentages: {},
        isPriorityBlocked: false,
        priorityCardId: null
    },
    methods: {
        addCard(cardData) {
            this.allCards.push(cardData)
            this.saveToLocalStorage()
            this.checkBlocking()
            this.checkPriorityBlocking()
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
            this.saveToLocalStorage()
            this.checkBlocking()
            this.checkPriorityBlocking()

            if (cardInfo.column === 3) {
                foundCard.skippedIndexes = []
                this.saveToLocalStorage()
            }
        },
        setCompletionDate (cardId) {
            const foundCard = this.allCards.find(card => card.id === cardId)
            if (foundCard) {
                foundCard.completedAt = new Date().toLocaleString()
                this.saveToLocalStorage()
            }
        },
        checkBlocking() {
            const cardsInSecond = this.allCards.filter(
                card => card.column === 2).length

            const hasCardOver50 = this.allCards.some(card =>
            card.column === 1 && this.cardPercentages[card.id] > 50)

            const wasBlocked = this.isFirstColumnBlocked
            this.isFirstColumnBlocked = cardsInSecond >= 5 && hasCardOver50

            if (wasBlocked && !this.isFirstColumnBlocked) {
                this.allCards.forEach(card => {
                    if (card.column === 1 && this.cardPercentages[card.id] > 50) {
                        card.column = 2
                    }
                })
            }
        },
        updatePercentage(data) {
            this.cardPercentages[data.cardId] = data.percentage
            this.checkBlocking()
        },
        toggleItemInCard (data) {
            const card = this.allCards.find(card => card.id === data.cardId)
            if (!card) return

            if (card.column === 3) {
                return
            }

            if (!card.isPriority && this.isPriorityBlocked) {
                alert('There is a priority task. Complete it first.')
                return
            }

            if (card.completedIndexes.includes(data.index)) {
                card.completedIndexes = card.completedIndexes.filter(i => i !== data.index)
            } else {
                card.completedIndexes.push(data.index)
            }
            this.saveToLocalStorage()
        },
        saveToLocalStorage() {
            localStorage.setItem('notes-app', JSON.stringify(this.allCards))
        },
        toggleSkipInCard(data) {
            const card = this.allCards.find(card => card.id === data.cardId)
            if (!card) return

            if (card.isPriority) {
                alert('Priority cards cannot be skipped')
                return
            }

            if (!card.isPriority && this.isPriorityBlocked) {
                alert('There is a priority task. Complete it first.')
                return
            }

            if (!card.skippedIndexes) {
                card.skippedIndexes = []
            }

            if (card.skippedIndexes.includes(data.index)) {
                card.skippedIndexes = card.skippedIndexes.filter(i => i !== data.index)
            } else {
                card.skippedIndexes.push(data.index)
            }

            if (card.column === 2 && card.skippedIndexes.length > 0) {
                card.column = 4
            }

            this.saveToLocalStorage()
        },
        loadFromLocalStorage() {
            const saved = localStorage.getItem('notes-app')
            if (saved) {
                this.allCards = JSON.parse(saved)
            }
        },
        checkPriorityBlocking () {
            const priorityCard = this.allCards.find(card =>
                card.isPriority && card.column !== 3
            )

            if (priorityCard) {
                this.isPriorityBlocked = true
                this.priorityCardId = priorityCard.id
                return true
            } else {
                this.isPriorityBlocked = false
                this.priorityCardId = null
                return false
            }
        }
    },
    mounted() {
        this.loadFromLocalStorage()
    }
})