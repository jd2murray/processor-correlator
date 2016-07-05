var path = require('path');
var _logger = require('log4js').getLogger(path.basename(__filename));

var AWSPromise = require('aws-sdk-promise');
AWSPromise.config.update({region: 'us-west-2'});
var S3 = new AWSPromise.S3();


class S3Utils {

    static createS3Bucket(bucketName : string) : Promise {
        _logger.debug('Creating s3 bucket: ' + bucketName + '.');

        var params = {
            Bucket: bucketName,
            ACL: 'public-read',
            CreateBucketConfiguration: {
                LocationConstraint: 'us-west-2'
            } //Permissions below...not needed right now - just creating public read.
            //GrantFullControl: 'STRING_VALUE',
            //GrantRead: 'STRING_VALUE',
            //GrantReadACP: 'STRING_VALUE',
            //GrantWrite: 'STRING_VALUE',
            //GrantWriteACP: 'STRING_VALUE'
        };
        var existsParams = {
            Bucket: bucketName
        };

        return new Promise(function (resolve, reject) {
            S3.createBucket(params).promise()
                .then(() => {
                    return (S3.waitFor('bucketExists', existsParams).promise());
                })   
                .then(()=> {resolve();})
                .catch((msg) => {
                    _logger.debug('Error creating s3 bucket! ' + JSON.stringify(msg));
                    reject();
                });
        });
    }

    static existsS3Bucket(bucketName : string, shouldExist : boolean) : Promise {
        var params = {
            Bucket: bucketName
        };
        _logger.debug('Checking if bucket exists: ' + bucketName + ', shouldExist: ' + shouldExist);

        return(new Promise(function(resolve, reject) {
            S3.headBucket(params).promise()
                .then((data) => {
                    _logger.debug('Exists: Data: ' + data);
                    if (data && shouldExist) {
                        resolve();
                    } else
                    {
                        reject();
                    }
                })
                .catch((msg) => {
                    _logger.debug('Exists catch: msg.code' + JSON.stringify(msg));

                    if(!shouldExist) {
                        resolve();
                    } else {
                        reject();
                    }
                })
        }));
    }

    static existsS3Object(bucketName : string, key: string, shouldExist : boolean) : Promise {
        var params = {
            Bucket: bucketName,
            Key: key
        };
        _logger.debug('Checking if object exists @:bucket: ' + bucketName + ',key:' + key + '.  shouldExist: ' + shouldExist);

        return(new Promise(function(resolve, reject) {
            S3.headObject(params).promise()
                .then((data) => {
                    if (data && shouldExist) {
                        resolve();
                    } else 
                    {
                        reject();
                    }
                })
                .catch(() => {
                    if(!shouldExist) {
                        resolve();
                    } else {
                        reject();
                    }
                })
        }));
    }

    static verifyRedirect(bucketName : string, redirectHost: string, prefix : string) : Promise {
        var params = {
            Bucket: bucketName
        };

        function verify(value, check) {
            if(!value) {throw ('Unverified check! (' + check + ')')}
        }

        return new Promise(function(resolve, reject) {
            _logger.debug('Verifying redirect');
            S3.getBucketWebsite(params).promise()
                .then(function(response) {
                    verify(response, 'response exists');
                    verify(response.data, 'data exists');
                    verify(response.data.RoutingRules, 'Routing rules exist');
                    verify(response.data.RoutingRules.length===1, '1 routing rule exists');
                    verify(response.data.RoutingRules[0].Redirect, 'redirect exits');
                    verify(response.data.RoutingRules[0].Condition.HttpErrorCodeReturnedEquals === '404', 'condition code is correct');
                    verify(response.data.RoutingRules[0].Redirect.HttpRedirectCode === '302', 'code is correct');
                    verify(response.data.RoutingRules[0].Redirect.HostName === redirectHost, 'hostname is correct');
                    verify(response.data.RoutingRules[0].Redirect.ReplaceKeyPrefixWith === prefix, 'prefix is correct');
                    resolve();
                })
                .catch((err) => {
                    _logger.warn(err);
                    reject();
                })
        });
    }

    static removeS3Bucket(bucketName: string) : Promise {
        var params = {
            Bucket: bucketName
        };
        _logger.debug('Deleting S3 bucket: ' + bucketName);
        return new Promise(function (resolve, reject) {
            S3.deleteBucket(params).promise()
                .then(() => {
                    return S3.waitFor('bucketNotExists', params).promise()
                })
                .then(() => {resolve()})
                .catch(() => {
                    reject();
                });
        });
    }
    
    static createS3Object(bucketName: string, key: string, fileData: string) : Promise {
        _logger.debug('Creating file @bucket:' + bucketName + ',key:' + key);
        return new Promise(function (resolve, reject) {
            var params = {Bucket: bucketName, Key: key, Body: fileData};
            S3.putObject(params).promise()
                .then(() => {
                    _logger.debug('Successfully created S3File @bucket:' + bucketName + ',key:' + key);
                    resolve(); 
                })
                .catch((err) => {
                    _logger.warn('Failed to create S3File @bucket:' + bucketName + ',key:' + key + '.err=' + JSON.stringify(err));
                    reject();
                }
            );   
        });
    }

    static setBucketRedirect(bucketName: string, redirectHost: string, prefix: string) : Promise {
        _logger.debug('Setting s3 bucket redirect: ' + bucketName + ', with redirect: ' + redirectHost + ', and prefix: ' + prefix);
        if(prefix === undefined) {
            prefix = '';
        }
        var params = {
            Bucket: bucketName,
            WebsiteConfiguration: {
                IndexDocument: {
                    Suffix: 'bogus.html'
                },
                RoutingRules: [
                    {
                        Redirect: {
                            HostName: redirectHost,
                            HttpRedirectCode: '302',
                            ReplaceKeyPrefixWith: prefix
                        },
                        Condition: {
                            HttpErrorCodeReturnedEquals: '404'
                        }
                    }
                ]
            }
        };
        return new Promise(function (resolve, reject) {
            S3.putBucketWebsite(params).promise()
                .then(resolve)
                .catch((msg) => {
                    reject('Error setting bucket redirect! ' + JSON.stringify(msg))
                });
        });
    }

    static removeS3BucketContents(bucketName: string, prefix: string):Promise {
        var params = {
            Bucket: bucketName
        };

        if(prefix === undefined) {
            prefix = '';
        }
        return new Promise(function (resolve, reject) {
            S3.listObjects(params).promise()
                .then(function (response) {
                    if (!response.err && response.data.Contents.length === 0) {
                        //No content in bucket, resolve successfully.
                        resolve();
                    }
                    else if (!response.err) {
                        //Content in bucket, need to remove content.
                        var deleteParams = {
                            Bucket: bucketName,
                            Delete: {
                                Objects: response.data.Contents
                                    .filter((item)=> {return (item.Key.startsWith(prefix))})
                                    .map((item) =>  {return ({Key: item.Key});})
                            }
                        };
                        S3.deleteObjects(deleteParams).promise()
                            .then(() => {
                                if (response.data.IsTruncated) {
                                    //If the list of content was truncated, then we get the next chunk and delete.
                                    S3Utils.removeS3BucketContents()
                                        .then(resolve)
                                        .catch((msg) => {
                                            var errorMsg = 'Unknown error removing s3 Bucket contents: ' + msg;
                                            _logger.warn(errorMsg);
                                            reject(errorMsg);
                                        });
                                } else {
                                    //Otherwise, we're done deleting contents.
                                    resolve();
                                }
                            })
                            .catch((msg) => {
                                var errorMsg = 'Unknown error removing s3 Bucket contents: ' + msg;
                                _logger.warn(errorMsg);
                                reject(errorMsg);
                            });
                    } else {
                        var errorMsg = 'error Listing bucket contents: ' + bucketName;
                        _logger.warn(errorMsg);
                        reject(errorMsg);
                    }
                })
                .catch((err) => {
                    _logger.warn('Unknown error listing bucket contents! ' + err);
                    reject(err);
                })
        })
    }
}

export default S3Utils;

