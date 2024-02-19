const axios = require('axios');

function getAPI(url) {
    return axios.get(url)
        .catch((error) => {
			console.log("Post loggggggg errrorr");
            console.log(JSON.stringify(error.response.data.errors));


        });            
}

function postAPI(url, data, options) {
    return axios.post(url, data, options) 
	.catch((error) => {
		console.log("Post loggggggg");
		//console.log(error);
       //   console.log(JSON.stringify(error.response.data.errors));
           // console.log("=================error catch====================");
          //  console.log(JSON.stringify(error));
           // console.log("=================error catch====================");
			


        });
}

module.exports = {
    getAPI,
    postAPI,
}