const serivce  = require(".././service/rm_reports/rm_gameAudit");
const service2 = require(".././service/rm_reports/rm_tablewise");
const service3 = require(".././service/rm_reports/rm_gamewise");
const serivce4 = require(".././service/rm_reports/rm_userwise")

const gameAudit = async (req,res) => {

    try{
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;
        const { result, total } = await serivce.rm_gameAudit(data, req.user)
        
        console.log("result--",result)
        res.status(200).send({
            success: true,
            result: result,
            totalRecords: total,
            page: {
                skip: data.skip,
                limit: data.limit
            }
        })

    }catch(err) {
        console.log(err)
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}

const tablewise = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service2.tablewise(data)

        res.status(200).send({
            success: true,
            result: result,
            totalRecords: total,
            page: {
                skip: data.skip,
                limit: data.limit
            }
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}

const gamewise = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service3.gamewise(data)

        res.status(200).send({
            success: true,
            result: result,
            totalRecords: total,
            page: {
                skip: data.skip,
                limit: data.limit
            }
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}


const userwise = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        console.log(req.user);
        const { result, total } = await serivce4.userwise(data, req.user)

        res.status(200).send({
            success: true,
            result: result,
            totalRecords: total,
            page: {
                skip: data.skip,
                limit: data.limit
            }
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }

}

module.exports = {
    gameAudit,
    tablewise,
    gamewise,
    userwise
}