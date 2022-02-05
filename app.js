var http = require('http');
const { Telegraf } = require('telegraf')
const axios = require('axios');
const fs = require('fs');
require('dotenv').config()

const rarityRank = JSON.parse(fs.readFileSync('rarityRank.json'));
const bot = new Telegraf(process.env.BOT_TOKEN)
// Bot subscription. Best to store in a database instead of storing in a variable.
let chats = []

bot.start((ctx) => {
    chats.push(ctx.update.message.chat.id)
    ctx.reply('You have subscribed to the alert')
    intervalFunc()
})
bot.help((ctx) => ctx.reply('type /start'))

bot.launch()

// Variables storing the previously announced NFT so we will not spam the user with the same one
let previousNFT = ''
let previousPrice = 0

// API Call taken from crypto.com
function intervalFunc() {
    axios.post(`https://crypto.com/nft-api/graphql`,
        {
            "operationName": "GetAssets",
            "variables": {
                "collectionId": "82421cf8e15df0edcaa200af752a344f",
                "first": 1,
                "skip": 0,
                "where": {
                    "assetName": null,
                    "description": null,
                    "minPrice": null,
                    "maxPrice": null,
                    "buyNow": true,
                    "auction": false,
                    "attributes": []
                },
                "sort": [
                    {
                        "order": "ASC",
                        "field": "price"
                    }
                ]
            },
            "query": "fragment UserData on User {\n  uuid\n  id\n  username\n  displayName\n  isCreator\n  avatar {\n    url\n    __typename\n  }\n  __typename\n}\n\nquery GetAssets($audience: Audience, $brandId: ID, $categories: [ID!], $collectionId: ID, $creatorId: ID, $ownerId: ID, $first: Int!, $skip: Int!, $cacheId: ID, $hasSecondaryListing: Boolean, $where: AssetsSearch, $sort: [SingleFieldSort!], $isCurated: Boolean, $createdPublicView: Boolean) {\n  public(cacheId: $cacheId) {\n    assets(\n      audience: $audience\n      brandId: $brandId\n      categories: $categories\n      collectionId: $collectionId\n      creatorId: $creatorId\n      ownerId: $ownerId\n      first: $first\n      skip: $skip\n      hasSecondaryListing: $hasSecondaryListing\n      where: $where\n      sort: $sort\n      isCurated: $isCurated\n      createdPublicView: $createdPublicView\n    ) {\n      id\n      name\n      copies\n      copiesInCirculation\n      creator {\n        ...UserData\n        __typename\n      }\n      main {\n        url\n        __typename\n      }\n      cover {\n        url\n        __typename\n      }\n      royaltiesRateDecimal\n      primaryListingsCount\n      secondaryListingsCount\n      primarySalesCount\n      totalSalesDecimal\n      defaultListing {\n        editionId\n        priceDecimal\n        mode\n        auctionHasBids\n        __typename\n      }\n      defaultAuctionListing {\n        editionId\n        priceDecimal\n        auctionMinPriceDecimal\n        auctionCloseAt\n        mode\n        auctionHasBids\n        __typename\n      }\n      defaultSaleListing {\n        editionId\n        priceDecimal\n        mode\n        __typename\n      }\n      defaultPrimaryListing {\n        editionId\n        priceDecimal\n        mode\n        auctionHasBids\n        primary\n        __typename\n      }\n      defaultSecondaryListing {\n        editionId\n        priceDecimal\n        mode\n        auctionHasBids\n        __typename\n      }\n      defaultSecondaryAuctionListing {\n        editionId\n        priceDecimal\n        auctionMinPriceDecimal\n        auctionCloseAt\n        mode\n        auctionHasBids\n        __typename\n      }\n      defaultSecondarySaleListing {\n        editionId\n        priceDecimal\n        mode\n        __typename\n      }\n      likes\n      views\n      isCurated\n      defaultEditionId\n      isLiked\n      __typename\n    }\n    __typename\n  }\n}\n"
        }
    ).then((res) => {
        // Crafts the message and sends to subscribers. If the new cheapest NFT is not the one previously announced, announce it.
        let name = res.data.data.public.assets[0].name
        let price = res.data.data.public.assets[0].defaultListing.priceDecimal
        if (chats.length > 0 && (name !== previousNFT || price !== previousPrice)) {
            let newMessage = name + ` at $${price}\n`
                + `Rank ${rarityRank[name]}/10000\n`
                + `https://crypto.com/nft/collection/82421cf8e15df0edcaa200af752a344f?asset=${res.data.data.public.assets[0].id}&edition=${res.data.data.public.assets[0].defaultEditionId}&detail-page=MARKETPLACE`

            chats.forEach(subscriber => {
                bot.telegram.sendMessage(subscriber, newMessage)
            });
            previousNFT = name
            previousPrice = price
        }
    }
    ).catch((error) => {
        console.log(error)
    });
}
setInterval(intervalFunc, 1000);


// Self call to hosted address to prevent heroku from sleeping
var server = http.createServer(function (req, res) {
    console.log('t')
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World');
});

setInterval(function () {
    http.get(process.env.HEROKU_URL);
}, 300000);


// listen for any incoming requests
server.listen(3000); //

console.log('Node.js web server at port 3000 is running..')