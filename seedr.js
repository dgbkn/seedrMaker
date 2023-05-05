function getActLink(html) {
    const regex = /<a.+?\s*href\s*=\s*["\']?([^"\'\s>]+)["\']?/gi;

    let m;
    while ((m = regex.exec(html)) !== null) {
        var seedrActivationLink = m[1];
        return seedrActivationLink;
    }

}

async function getFile(id,token) {
    var data = new FormData();
    data.append('access_token', token);
    data.append('func', 'fetch_file');
    data.append('folder_file_id', id);

    var res = await axios({
      method: 'post',
      url: 'https://www.seedr.cc/oauth_test/resource.php',
      headers: data.getHeaders(),
      data: data
    });
    return res.data;
  }




module.exports = {getActLink,getFile};