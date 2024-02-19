const axios = require('axios');

function getAPI(url, options) {
    return axios.get(url,options)
        .catch((error) => {
			console.log("Post loggggggg");
            console.log(JSON.stringify(error.response.data.errors));


        });            
}

function postAPI(url, data, options) {
    return axios.post(url, data, options) 
	.catch((error) => {
		console.log("Post loggggggg");
		//console.log(error);
            //console.log(JSON.stringify(error.response.data.errors));
           // console.log("=================error catch====================");
          //  console.log(JSON.stringify(error));
           // console.log("=================error catch====================");
			


        });
}

module.exports = {
    getAPI,
    postAPI,
}