'use strict';


const querystring = require('querystring');
const methods = require('./methods');
const config = require('./config');
require('ssl-root-cas').inject()
.addFile(__dirname + '/Go Daddy Root Certificate Authority - G2.crt')
.addFile(__dirname + '/Go Daddy Secure Certificate Authority - G2.crt')
.addFile(__dirname + '/_.utb.edu.co.crt');
const https = require('https')

/**
 * Gets a cookie from the Banner server
 * @private
 * @param {number | string} term A valid term code
 * @returns {Promise<string[]>} A Promise containing the cookie returned by the server
 */
async function getCookie(school, term){

    let res = await bannerRequest(school, 'getCookie', {'term': term});
    return res.Response.headers['set-cookie'];
}

async function bannerRequest(school, method, params={}, needsCookie=false){
    let cookie = needsCookie ? getCookie(school, params.term) : null;
    console.log(querystring.stringify(params))
    const options = {
        method: 'GET',
        hostname: config.schools[school].host,
        port: config.schools[school].port,
        path: config.global.basePath + methods[method].path + '?' + querystring.stringify(params),
        headers: {
            'Cookie': await cookie

        }
    };
    return await promiseRequest(options);
}

/**
 * Promise wrapper for HTTPS.get
 * @private
 * @param {string} url The URL to send the request to
 * @returns {Promise<{Response: IncomingMessage, Body}>} A Promise containing the response object and parsed body as JSON
 */
async function promiseRequest(url){
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let body = '';
            res.on('data', (d) => body += d);
            res.on('error', (err) => reject(err));
            res.on('end', () => {
                console.log(body)
                return(
                resolve({
                'Response': res, 
                'Body': JSON.parse(body)
            }))});
        }).on('error', (err) => reject(err));
    });
}

async function batchRequest(batchSize, pageSize, batch, requestParams={}, method, school){
    if(batchSize <= pageSize){
        throw new Error('Batch size must be greater than page size');
    }
    const idxs = [...Array(batchSize / pageSize).keys()].map(idx => ++idx + (batchSize / pageSize ) * batch);
    let res = await Promise.all(idxs.map(async idx => {
        const params = {
            offset: idx,
            max: pageSize,
            ...requestParams
        };
        return bannerRequest(school, method, params);
    }));
    return res.map(obj => obj.Body).flat();
}

/**
 * @exports
 */
module.exports = {promiseRequest, bannerRequest, getCookie, batchRequest};