function sameDayMidnight(theDay) {
    weekdays = new Array('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');
    thisWeekDay = weekdays[theDay.getDay()];

    thisDay = theDay.getDate();

    months = new Array('January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December');
    thisMonth = months[theDay.getMonth()];

    thisYear = theDay.getFullYear();

    return Date.parse(thisWeekDay + ", " + thisMonth + " " + thisDay + ", " + thisYear);
}

//----- CONSTANTS -------
var oneDayMilliseconds = 1*24*60*60*1000;
var businessWeekMilliseconds = 5*oneDayMilliseconds;
var fullWeekMilliseconds = 7*oneDayMilliseconds;

//Russia time format, week starts from Monday
function weekDay(d) {
    return (d.getDay() == 0) ? 7 :  d.getDay();
}

function isOnWeekends(d) {
    return (weekDay(d) == 6 || weekDay(d) == 7) ? true : false;
}

function timeUntilFullWeekEnds(d) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dd = new Date(d.getDate() + " " + months[d.getMonth()] + " " + d.getFullYear() + " " + "23" + ":" + "59" + ":" + "59" + " GMT+0300");
    dt_untilDayEnds = dd.getTime() - d.getTime();

    if (weekDay(d) == 7) {
        return dt_untilDayEnds;
    } else {
        return dt_untilDayEnds + (7 - weekDay(d)) * oneDayMilliseconds;
    }
}

function timeFromFullWeekStarted(d) {
    return fullWeekMilliseconds - timeUntilFullWeekEnds(d);
}

function timeUntilBusinessWeekEnds(d) {
    return Math.max(0, timeUntilFullWeekEnds(d) - 2*oneDayMilliseconds);
}

function timeFromBusinessWeekStarted(d) {
    return Math.min(businessWeekMilliseconds, timeFromFullWeekStarted(d));
}

function weekNumber(d) {
    //1st January same year
    var dd = new Date("01" + " " + "Jan" + " " + d.getFullYear() + " " + "00" + ":" + "00" + ":" + "00" + " GMT+0300");
    var dt_untilFirstMonday = (7 - weekDay(dd) + 1) * oneDayMilliseconds;

    var dt_total = d.getTime() - dd.getTime();

    if (dt_total <= dt_untilFirstMonday) {
        return 1;
    } else {
        return Math.ceil((dt_total - dt_untilFirstMonday)  / (7*oneDayMilliseconds)) + 1;
    }
}

function timePeriod(noWeekendsFlag, start, end) {
    dt_total = end.getTime() - start.getTime();

    if (noWeekendsFlag == false) {
        dt_result =  dt_total;
    } else {
        //we use the fact end > start
        if (weekNumber(start) == weekNumber(end)) {
            if (isOnWeekends(start)) {
                dt_result = 0;
            } else {
                if (isOnWeekends(end)) {
                    dt_result = timeUntilBusinessWeekEnds(start);
                } else {
                    dt_result = dt_total;
                }
            }
        } else {
            dt_result = timeUntilBusinessWeekEnds(start) + (weekNumber(end) - weekNumber(start) - 1) * fullWeekMilliseconds + timeFromBusinessWeekStarted(end);
        }
    }

    return dt_result;
}
