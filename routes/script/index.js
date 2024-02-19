const moment = require("moment");
const logger = require("tracer").colorConsole();

const GameAudit = require("../model/gameAudit");

const removeAuditDataBeforeSevenDays = async () => {
    logger.info("Script: Inside removeAuditDataBeforeSevenDays")
    const lastWeekDate = moment().subtract(7, "days");
    await GameAudit.deleteMany({ createdAt: { $lt: lastWeekDate } });
}

module.exports = {
    removeAuditDataBeforeSevenDays
}