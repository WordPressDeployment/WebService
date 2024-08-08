# mCylia Web Service
The purpose of this web service is to display real time data about a pool of mCylia boxes that a user owns

## Dependencies
* [Webject](https://www.npmjs.com/package/webject)
* [mysql](https://www.npmjs.com/package/mysql)

## Installing Dependencies
```bash
npm install
```

## API
### Prelude
The entire webservice's purpose is to return a webject token that will send real-time data of an _mcylia box_. To maintain formatting until it reaches the client, the token is encoded in base64 when sent to the _TrustedEntity_ which is the _WordPress domain_ it communicates with
#### Specific Event ID

```js
TrustedEntity--({[AUTH_HEAD]:AUTH_VALUE, 'mcylia-box':some-box-id, 'start-and-end':`${longint_s};${longint_e}`})-->WebService
WebService--(weird_base64_str)-->TrustedEntity
TrustedEntity--(load iframe of `https://${WebServiceURL}/${weird_base64_str}`)-->Client
```
The works only when the `WebService` and the `TrustedEntity` know the contents of these secret *AUTH_HEAD* and *AUTH_VALUE* variables<br>
Also, the `longint_s` and `longint_e` would be the timestamps for the event _start_ and _event_ end respectively
#### Entire Listing Page
```js
TrustedEntity--({[AUTH_HEAD]:AUTH_VALUE, 'state_activity':some-box-ids-joined-by-semicolon`})-->WebService
WebService--(btoa(some-one-use-token))-->TrustedEntity
TrustedEntity--(await connect(`wss://${WebServiceURL}`,atob(weird_base64_str)))-->Client
```
The also works when only the `WebService` and the `TrustedEntity` know the contents of these secret *AUTH_HEAD* and *AUTH_VALUE* variables

## Environment Variables
There are some environment variables required to be set for this repository to work
- `AUTH_HEAD`: for only allowing an entity that knows its content to get desired interaction with this webservice
- `AUTH_VALUE`: just like *AUTH_HEAD* and it would be sent as a setHeader(AUTH_HEAD,AUTH_VALUE) to obtain desired interaction frmo this webservice (leave these two out to allow anyone to use this webservice)
- `DB_URL`: the url to connect to the database
- `DB_USER`: the username to use when connecting to the database
- `DB_PASS`: the password to use when connecting to the database
