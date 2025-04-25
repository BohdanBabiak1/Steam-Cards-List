const elementsList = document.querySelector(".list")

const baseURL = 'https://steamcommunity.com/market/search/render/?query=&count=100&search_descriptions=0&sort_column=price&sort_dir=asc&appid=753&category_753_Event[]=any&category_753_Game[]=any&category_753_item_class[]=tag_item_class_2&category_753_cardborder[]=tag_cardborder_0&norender=1';
const proxyPrefix = 'https://corsproxy.io/?';
// const proxyPrefix = 'http://localhost:3000/proxy?url=';

let allItems = [];
let groupedByGamesItems = [];

let startItem = 8100;
let lastStartSavedItem = localStorage.getItem('StartNumberItem');
if (lastStartSavedItem) {
    startItem = parseInt(JSON.parse(lastStartSavedItem));
}
let nextStartItem = startItem + 100
// let nextStartItem = 0

let savedTime = 999999;
let lastSaveTimestamp = localStorage.getItem('SavedTimestamp');
if (lastSaveTimestamp){
    savedTime = parseInt(JSON.parse(lastSaveTimestamp));
}
const currentTime = Date.now();

// 60000
// if (currentTime - savedTime >= 6000000000000) {
//     console.log("Список згенеровано")
//     findPriceBoundary()
//     // findAllItems()
// } else {
//     console.log("Список завантажено з пам'яті")
//     let savedItemsList = localStorage.getItem('SavedItemsList');
//     if (savedItemsList){
//         allItems = JSON.parse(savedItemsList);
//     }
// }

allItems

fetch('./steam_cards_unique.json')
  .then(response => response.json())
  .then(data => {
    allItems = data
});

// console.log(allItems)
findCardsByGame()
createList(groupedByGamesItems)

function createList(items){
    items.forEach(group => {
        let newElement = document.createElement('li');
        newElement.classList.add('list_element');
    
        let totalPrice = 0;
        group.forEach(card => {
            totalPrice += card.sell_price;
        });
        totalPrice = totalPrice / 100;
    
        newElement.innerHTML = `
            <div class="cards_preview">
                <div class="card_list">
                    ${group.slice(0, 5).map(card => `
                        <div class="card_wrap">
                            <img src="https://community.fastly.steamstatic.com/economy/image/${card.asset_description.icon_url}/62fx62f">
                        </div>
                    `).join('')}
                </div>
                <div class="name_of_game">${group[0].asset_description.type.split(' — ')[0]}</div>
            </div>
            <div class="number_of_cards">${group.length}</div>
            <div class="cards_price">${totalPrice.toFixed(2)}$</div>
            <input type="button" class="buy_btn" value="Buy">
        `;
    
        elementsList.appendChild(newElement);
    });
}

function findCardsByGame() {
    groupedByGamesItems = [];

    allItems.forEach(item => {
        const gameId = item.hash_name.split('-')[0];

        let gameGroup = groupedByGamesItems.find(group => group[0].hash_name.split('-')[0] === gameId);

        if (!gameGroup) {
            gameGroup = [];
            groupedByGamesItems.push(gameGroup)
        }

        gameGroup.push(item);
    });

    console.log(groupedByGamesItems);
}

function findPriceBoundary() {
    const url = proxyPrefix + encodeURIComponent(baseURL + `&start=${startItem}`);
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'json';
    request.send();

    request.onload = function () {
        let itemsToCheck = [];
        let chekedItems = [];

        const response = request.response;
        if (response && response.results) {
            itemsToCheck = itemsToCheck.concat(response.results);

            itemsToCheck.forEach(function (item) {
                if (parseFloat(item.sell_price) > 0) {
                    chekedItems = chekedItems.concat(item);
                }
            });

            console.log(`${startItem} | ${chekedItems.length}`)

            if (chekedItems.length > 0 && chekedItems.length < 100) {
                localStorage.setItem('StartNumberItem', JSON.stringify(startItem));
                allItems.unshift(...chekedItems);
                nextStartItem = startItem + 100

                findAllItems()
                return;
            }
            else if (chekedItems.length == 0) {
                startItem += 100;
            }
            else if (chekedItems.length == 100) {
                startItem -= 100;
                allItems.unshift(...chekedItems);
            }

            findPriceBoundary();
        }
        else{
            console.error('Помилка при завантаженні запиту');
            return
        }
    };

    request.onerror = function () {
        console.error('Помилка при завантаженні запиту');
        return
    };
}

function findAllItems() {
    const url = proxyPrefix + encodeURIComponent(baseURL + `&start=${nextStartItem}`);
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'json';
    request.send();

    request.onload = function () {
        let items = [];

        const response = request.response;
        if (response && response.results) {
            items = items.concat(response.results);

            allItems.push(...items)
            
            console.log(`${nextStartItem} | ${items.length}`)
            if (items.length != 100){
                console.log("!!!!!Список згенеровано!!!!")
                saveInMemory();
                return
            }

            nextStartItem += 100

            findAllItems();
        }
        else{
            console.error('Помилка при завантаженні запиту');
            return
        }
    };

    request.onerror = function () {
        console.error('Помилка при завантаженні запиту');
        return
    };
}

function saveInMemory(){
    localStorage.setItem('SavedTimestamp', JSON.stringify(Date.now()));
    localStorage.setItem('SavedItemsList', JSON.stringify(allItems));
}