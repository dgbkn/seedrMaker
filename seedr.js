function getActLink(html) {
    const regex = /<a.+?\s*href\s*=\s*["\']?([^"\'\s>]+)["\']?/gi;

    let m;
    while ((m = regex.exec(html)) !== null) {
        var seedrActivationLink = m[1];
        return seedrActivationLink;
    }

}


module.exports = {getActLink};