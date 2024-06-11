# mCylia Web Service
The purpose of this web service is to display real time data about a pool of mCylia boxes that a user owns

## Dependencies
* [Webject](https://www.npmjs.com/package/webject)
* [ws](https://www.npmjs.com/package/ws)

## Installing Dependencies
```bash
npm install
```

## Routes
There are two routes for real time connections
* one is for a trusted server after it sends a request for a user with correct headers, a url to be used as an iframe is returned so that server gets text from webservice, sends iframe of webservice/receivedtext
* one is for admin, it is a route that when loaded, a token is prompted on first time and is used for a connection to all the data
