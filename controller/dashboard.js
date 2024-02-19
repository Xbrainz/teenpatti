const UserRole = require("./../constant/userRole");
const User = require("./../model/user");

const dashboard = async function (req, res) {
    const user = req.user;
    let userCount = 0, agentCount = 0, distributorCount = 0;
    if (user && [UserRole.ADMIN].includes(user.role)) {
        distributorCount = await User.count({ role: UserRole.DISTRIBUTOR });
        agentCount = await User.count({ role: UserRole.AGENT });
        userCount = await User.count({ role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } });
    } else if (user && [UserRole.DISTRIBUTOR].includes(user.role)) {
        agentCount = await User.count({ distributorId: user.id, role: UserRole.AGENT });
        let agentIds = await User.find({ distributorId: user.id, role: UserRole.AGENT},{_id:1});
        agentIds = agentIds.map(agent => agent._id)
        userCount = await User.count({ agentId: { $in: agentIds}, role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } });
    } else if (user && [UserRole.AGENT].includes(user.role)) {
        userCount = await User.count({ agentId: user.id, role: { $in: [UserRole.USER, UserRole.ADMIN_USER] } })
    }

    res.status(200).json({
        userCount: userCount,
        agentCount: agentCount,
        distributorCount: distributorCount
    })

}

module.exports = {
    dashboard
}