const service = require("./../service/po_reports");

const turnover = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.turnover(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
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

        const { result, total } = await service.tablewise(data)

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

        const { gamewise, total } = await service.gamewise(data)

        res.status(200).send({
            success: true,
            result: gamewise,
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

const agentwise = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total, totalEarning } = await service.agentwise(data, req.user)

        res.status(200).send({
            success: true,
            result,
            totalEarning,
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

const distributorwise = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total, totalEarning } = await service.distributorwise(data)

        res.status(200).send({
            success: true,
            result: result,
            totalEarning,
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
        const { result, total } = await service.userwise(data, req.user)

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

const getCommissionByAgentId = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.getCommissionByAgentId(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}

const getCommissionByDistributorId = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.getCommissionByDistributorId(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}

const getCommissionByAdminId = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.getCommissionByAdminId(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}

const anteTablewise = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service.anteTablewise(data)

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

const anteTablewiseDetails = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.anteTablewiseDetails(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}

const antePlayerwise = async (req, res) => {
    try {
        const data = req.query;
        const { user } = req;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service.antePlayerwise(data, user)

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

const antePlayerwiseDetails = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.antePlayerwiseDetails(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }
}

const rakeTablewise = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service.rakeTablewise(data)

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

const rakeTablewiseDetails = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.rakeTablewiseDetails(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }

}

const rakePlayerwise = async (req, res) => {
    try {
        const data = req.query;
        const { user } = req;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service.rakePlayerwise(data, user)

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

const rakePlayerwiseDetails = async (req, res) => {
    try {
        const data = req.query;

        const result = await service.rakePlayerwiseDetails(data)

        res.status(200).send({
            success: true,
            result,
        })
    } catch (err) {
        res.status(404).send({
            success: false,
            msg: err.message
        })
    }

}
const settlement = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

console.log("........req.query.................. " , req.user);
console.log(".........req.query................. " , req.query);
        const { result, total } = await service.settlement(data, req.user)

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

const playerHourly = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service.playerHourly(data, req.user)

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

const gameAudit = async (req, res) => {
    try {
        const data = req.query;

        data.limit = parseInt(data.limit, 10) || 10;
        data.skip = parseInt(data.skip, 10) || 0;

        const { result, total } = await service.gameAudit(data, req.user)

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
    turnover,
    tablewise,
    gamewise,
    agentwise,
    distributorwise,
    userwise,
    getCommissionByAgentId,
    getCommissionByDistributorId,
    getCommissionByAdminId,
    anteTablewise,
    anteTablewiseDetails,
    antePlayerwise,
    antePlayerwiseDetails,
    rakeTablewise,
    rakeTablewiseDetails,
    rakePlayerwise,
    rakePlayerwiseDetails,
    settlement,
    playerHourly,
    gameAudit
}