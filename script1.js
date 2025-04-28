const elementsList = document.querySelector(".list")

const proxyPrefix = 'https://corsproxy.io/?'
const base_url = "https://steamcommunity.com/market/search/render/";
const params = {
    query: "",
    count: 100,
    start: 0,
    search_descriptions: 0,
    sort_column: "price",
    sort_dir: "asc",
    appid: 753,
    "category_753_Event[]": "any",
    "category_753_Game[]": "any",
    "category_753_item_class[]": "tag_item_class_2",
    "category_753_cardborder[]": "tag_cardborder_0",
    norender: 1
};

let loadItemsCount = 100

let startItem = 8100
let lastStartSavedItem = localStorage.getItem('StartNumberItem')
if (lastStartSavedItem) {
    startItem = parseInt(JSON.parse(lastStartSavedItem))
}
let otherStartItem = startItem + 100

let startItems = []
let findStartItem = true
let uniqueGameIds = new Set();

let allGameCards = {};
let i = 0

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

async function loadItems() {
    const urlParams = new URLSearchParams(params);
    urlParams.set('start', startItem)
    const url = `${proxyPrefix}${base_url}?${urlParams.toString()}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            console.error('Помилка при завантаженні запиту')
            return
        }

        const data = await response.json()

        if (data && data.results) {
            if (data.total_count == 0) {
                await sleep(1000)
                await loadItems()
                return
            }

            if (findStartItem) {
                let chekedItems = []
                data.results.forEach(item => {
                    if (parseFloat(item.sell_price) > 0) {
                        chekedItems = chekedItems.concat(item)
                    }
                })

                if (chekedItems.length > 0 && chekedItems.length < 100) {
                    localStorage.setItem('StartNumberItem', JSON.stringify(startItem))
                    startItems.unshift(...chekedItems)
                    startItem = otherStartItem
                    findStartItem = false
                    await loadItems()
                    return
                } 
                else if (chekedItems.length == 0) {
                    startItem += 100
                    otherStartItem = startItem + 100
                } 
                else if (chekedItems.length == 100) {
                    startItem -= 100
                    startItems.unshift(...chekedItems)
                }
            } 
            else if (loadItemsCount > 0) {
                startItems.push(...data.results)
                loadItemsCount -= 100
            } 
            else {
                console.log(startItems)

                startItems.forEach(card => {
                    const gameId = card.hash_name.split('-')[0];
                    uniqueGameIds.add(gameId);
                });
                console.log(Array.from(uniqueGameIds))
                findGamesCards()
                return
            }

            await loadItems()
        } else {
            console.error('Помилка при завантаженні запиту')
            return
        }
    } catch (error) {
        console.error('Помилка при завантаженні:', error)
        return
    }
}

async function findGamesCards() {
    let uniqueGameIdsArray = Array.from(uniqueGameIds)

    if (i >= uniqueGameIdsArray.length || i >= 20){
        console.log(allGameCards);
        // createList(allGameCards)
        return
    }

    const urlParams = new URLSearchParams(params);
    urlParams.set('category_753_Game[]', `tag_app_${uniqueGameIdsArray[i]}`)
    const url = `${proxyPrefix}${base_url}?${urlParams.toString()}`

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        })

        if (!response.ok) {
            console.error('Помилка при завантаженні запиту')
            return
        }

        const data = await response.json()

        if (data && data.results) {
            if (data.total_count == 0) {
                await sleep(1000);
                await findGamesCards();
                return;
            }

            allGameCards[uniqueGameIdsArray[i]] = data.results;
            createListElement(uniqueGameIdsArray[i], data.results)
            i++;

            await findGamesCards();
        } else {
            console.error('Помилка при завантаженні запиту')
            return
        }
    } catch (error) {
        console.error('Помилка при завантаженні:', error)
        return
    }
}

function createList(cardsSortByGames) {
    for (const [gameId, cards] of Object.entries(cardsSortByGames)) {
        let newElement = document.createElement('li');
        newElement.classList.add('list_element');

        let totalPrice = cards.reduce((sum, card) => sum + card.sell_price, 0) / 100;

        newElement.innerHTML = `
            <div class="cards_preview">
                <div class="card_list">
                    ${cards.slice(0, 5).map(card => `
                        <div class="card_wrap">
                            <img src="https://community.fastly.steamstatic.com/economy/image/${card.asset_description.icon_url}/62fx62f">
                        </div>
                    `).join('')}
                </div>
                <a class="name_of_game" href="https://steamcommunity.com/market/search?q=&category_753_Event[]=any&category_753_Game[]=tag_app_${gameId}&category_753_cardborder[]=tag_cardborder_0&category_753_item_class[]=tag_item_class_2&appid=753" target="_blank">${cards[0].asset_description.type.split(' — ')[0]}</a>
            </div>
            <div class="number_of_cards">${cards.length}</div>
            <div class="cards_price">${totalPrice.toFixed(2)}$</div>
            <input type="button" class="buy_btn" value="Buy">
        `;

        elementsList.appendChild(newElement);
    }
}

function createListElement(gameId, cards) {
    let newElement = document.createElement('li');
        newElement.classList.add('list_element');

        let totalPrice = cards.reduce((sum, card) => sum + card.sell_price, 0) / 100;

        newElement.innerHTML = `
            <div class="cards_preview">
                <div class="card_list">
                    ${cards.slice(0, 5).map(card => `
                        <div class="card_wrap">
                            <img src="https://community.fastly.steamstatic.com/economy/image/${card.asset_description.icon_url}/62fx62f">
                        </div>
                    `).join('')}
                </div>
                <a class="name_of_game" href="https://steamcommunity.com/market/search?q=&category_753_Event[]=any&category_753_Game[]=tag_app_${gameId}&category_753_cardborder[]=tag_cardborder_0&category_753_item_class[]=tag_item_class_2&appid=753" target="_blank">${cards[0].asset_description.type.split(' — ')[0]}</a>
            </div>
            <div class="number_of_cards">${cards.length}</div>
            <div class="cards_price">${totalPrice.toFixed(2)}$</div>
            <input type="button" class="buy_btn" value="Buy">
        `;

        elementsList.appendChild(newElement);
}

loadItems()