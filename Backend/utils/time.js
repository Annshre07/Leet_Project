const moment = require("moment-timezone");

const IST = "Asia/Kolkata";

// A deadline is a calendar date (YYYY-MM-DD) that stays valid until the end of that day in IST.
const parseDeadline = (value) => {
    if (!value) return null;
    const m = moment.tz(value, "YYYY-MM-DD", true, IST);
    return m.isValid() ? m.endOf("day").toDate() : undefined; // undefined = invalid
};
const formatDeadline = (date) => (date ? moment(date).tz(IST).format("YYYY-MM-DD") : null);
const startOfTodayIST = () => moment().tz(IST).startOf("day").toDate();
// Legacy rows stored midnight UTC of the date; both shapes fall on the same IST calendar date.
const isExpired = (date, now = new Date()) => {
    if (!date) return false;
    const last = moment.tz(formatDeadline(date), "YYYY-MM-DD", IST).endOf("day");
    return moment(now).isAfter(last);
};

module.exports = { parseDeadline, formatDeadline, startOfTodayIST, isExpired, IST };
