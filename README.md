# mCylia Web Service
The purpose of this web service is to display real time data about a pool of mCylia boxes that a user owns

## Dependencies
* [Webject](https://www.npmjs.com/package/webject)
* [ws](https://www.npmjs.com/package/ws)
* [mysql](https://www.npmjs.com/package/mysql)

## Installing Dependencies
```bash
npm install
```

## API
The entire webservice's purpose is to return a link that will display real time data of an mcylia box.
```js
TrustedEntity--({[AUTH_HEAD]:AUTH_VALUE, 'mcylia-box':some-box-id})-->WebService
WebService--(some-one-use-token)-->TrustedEntity
TrustedEntity--('WebServiceURL/'+some-one-use-token)-->Client
```
The works when only the `WebService` and the `TrustedEntity` know the contents of these secret *AUTH_HEAD* and *AUTH_VALUE* variables

## Environment Variables
There are some environment variables required to be set for this repository to work
- `AUTH_HEAD`: for only allowing an entity that knows its content to get desired interaction with this webservice
- `AUTH_VALUE`: just like *AUTH_HEAD* and it would be sent as a setHeader(AUTH_HEAD,AUTH_VALUE) to obtain desired interaction frmo this webservice (leave these two out to allow anyone to use this webservice)
- `DB_URL`: the url to connect to the database
- `DB_USER`: the username to use when connecting to the database
- `DB_PASS`: the password to use when connecting to the database