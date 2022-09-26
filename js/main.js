var apiRoot = "https://api.github.com/";
var apiSourceforge = "https://sourceforge.net/projects/";

// Return a HTTP query variable
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for(var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable) {
            return pair[1];
        }
    }
    return "";
}

// Format numbers
function formatNumber(value) {
    return value.toString().replace(/(\d)(?=(\d{3})+$)/g, '$1,')
}

// Validate the user input
function validateInput() {
    if ($("#username").val().length > 0 && $("#repository").val().length > 0) {
        $("#get-stats-button").prop("disabled", false);
    } else {
        $("#get-stats-button").prop("disabled", true);
    }
}

// Move to #repository when hit enter and if it's empty or trigger the button
$("#username").keyup(function (event) {
    if (event.keyCode === 13) {
        if (!$("#repository").val()) {
            $("#repository").focus();
        } else {
            $("#get-stats-button").click();
        }
    }
});

// Callback function for getting user repositories
function getUserRepos() {
    var user = $("#username").val();

    var autoComplete = $('#repository').typeahead({ 
        autoSelect: true,
        afterSelect: function() {
            $("#get-stats-button").click();
        }
     });
    var repoNames = [];

    var url = apiRoot + "users/" + user + "/repos";
    $.getJSON(url, function(data) {
        $.each(data, function(index, item) {
            repoNames.push(item.name);
        });
    });

    autoComplete.data('typeahead').source = repoNames;
}

function sourceforceApi(url) {
    var value = $.ajax({ 
        url: url, 
        async: false,
        statusCode: {301: "Release does not exist"},
        error: ""
     });

    return {"status": value.status, "data": value.responseJSON};

}

function showStats(data) {
    var gh_err = false;
    var sf_err = false;
    var errMessage = '';
    project = $("#sourceforge").val();
    var today = new Date();  
    today = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    date = "?start_date=2009-08-20&end_date=" + today
    sfProjectUrl = apiSourceforge + project + "/files/stats/json" + date

    let sfmainproject = sourceforceApi(sfProjectUrl)
    if(data.status == 404) {
        gh_err = true;
        errMessage = "The Github project does not exist!";
    }
    else if(data.status == 403) {
        gh_err = true;
        errMessage = "You've exceeded GitHub's rate limiting.<br />Please try again in about an hour.";
    }
    else if(data.status == 0) {
        gh_err = true;
        errMessage = "Network Error when attempting to fetch GitHub's resource";
    }

    if(data.length == 0) {
        gh_err = true;
        errMessage = getQueryVariable("page") > 1 ? "No more releases" : "There are no releases for this project";
    }

    if(sfmainproject.status == 404) {
        sf_err = true;
        errMessage = "The Sourcefoge project does not exist!";
    }  else if(sfmainproject.status != 200) {
        gh_err = true;
        errMessage = "Error when attempting to fetch GitHub's resource. Check console log";
    }


    var html_gh = "";
    var html_sf = "";

    if(sf_err || gh_err) {
        if(gh_err) {
            var html_err = "<div class='alert alert-danger output'>" + errMessage + "</div>";
        }
        if(sf_err) {
            var html_err = "<div class='alert alert-danger output'>" + errMessage + "</div>";
        }
        var resultDiv_err = $("#message");
        resultDiv_err.html(html_err);
    } else {
        html_gh += "<div class='output'>";

        var isLatestRelease = getQueryVariable("page") == 1 ? true : false;
        var totalDownloadCount = 0;
        $.each(data, function(index, item) {
            var releaseTag = item.tag_name;
            var releaseBadge = "";
            var releaseClassNames = "release";
            var releaseURL = item.html_url;
            var isPreRelease = item.prerelease;
            var releaseAssets = item.assets;
            var releaseDownloadCount = 0;
            var releaseAuthor = item.author;
            var publishDate = item.published_at.split("T")[0];
            var releaseName = item.name.trim();
            var sourceforge_release_exist = false

            var sourceforgeurl = apiSourceforge + project + "/files/" + releaseName + "/stats/json" + date
            let sfreleaseproject = sourceforceApi(sourceforgeurl)

            if (sfreleaseproject.status === 200) {            
                var sf_releaseTotalDownloadCount = sfreleaseproject.data.total
                sourceforge_release_exist = true
            }

            if(isPreRelease) {
                releaseBadge = "&nbsp;&nbsp;<span class='badge'>Pre-release</span>";
                releaseClassNames += " pre-release";
            } else if(isLatestRelease) {
                releaseBadge = "&nbsp;&nbsp;<span class='badge'>Latest release</span>";
                releaseClassNames += " latest-release";
                isLatestRelease = false;
            }

            var downloadInfoHTML = "";
            var sf_downloadInfoHTML = "";
            if(releaseAssets.length) {
                downloadInfoHTML += "<h4><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
                    "Download Info</h4>";

                downloadInfoHTML += "<ul>";
                sf_downloadInfoHTML = downloadInfoHTML
                $.each(releaseAssets, function(index, asset) {

                    var assetSize = (asset.size / 1048576.0).toFixed(2);
                    var lastUpdate = asset.updated_at.split("T")[0];

                    downloadInfoHTML += "<li><code>" + asset.name + "</code> (" + assetSize + "&nbsp;MiB) - " +
                        "downloaded " + formatNumber(asset.download_count) + "&nbsp;times" + "</li>";

                    totalDownloadCount += asset.download_count;
                    releaseDownloadCount += asset.download_count;
                    // Sourceforge
                    if (sourceforge_release_exist) {    
                        sourceforgeurl = apiSourceforge + project + "/files/" + releaseName + "/" + asset.name + "/stats/json" + date
                        let sfreleaseasset = sourceforceApi(sourceforgeurl)
                        if (sfreleaseasset.data) {
                            sfassettotalcount = "downloaded " + formatNumber(sfreleaseasset.data.total) + "&nbsp;times"
                        } else {
                            sfassettotalcount = "The file is not available on Sourceforge. Maybe has been uploaded in different folder"
                        }
                        sf_downloadInfoHTML += "<li><code>" + asset.name + "</code> (" + assetSize + "&nbsp;MiB) - " + sfassettotalcount + "</li>";
                    }

                });
            
            }

            html_gh += "<div class='row " + releaseClassNames + "'>";

            html_gh += "<h3><span class='glyphicon glyphicon-tag'></span>&nbsp;&nbsp;" +
                "<a href='" + releaseURL + "' target='_blank'>" + releaseTag + "</a>" +
                releaseBadge + "</h3>" + "<hr class='release-hr'>";

            html_gh += "<h4><span class='glyphicon glyphicon-info-sign'></span>&nbsp;&nbsp;" +
                "Release Info</h4>";

            html_gh += "<ul>";

            if (releaseAuthor) {
                html_gh += "<li><span class='glyphicon glyphicon-user'></span>&nbsp;&nbsp;" +
                    "Author: <a href='" + releaseAuthor.html_url + "'>@" + releaseAuthor.login  +"</a></li>";
            }

            html_gh += "<li><span class='glyphicon glyphicon-calendar'></span>&nbsp;&nbsp;" +
                "Published: " + publishDate + "</li>";

            if(releaseDownloadCount) {
                html_gh += "<li><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
                    "Downloads: " + formatNumber(releaseDownloadCount) + "</li>";
            }

            html_gh += "</ul>";

            html_gh += downloadInfoHTML;

            html_gh += "</div>";

            // Sourceforge

            html_sf += "<div class='row " + releaseClassNames + "'>";

            html_sf += "<h3><span class='glyphicon glyphicon-tag'></span>&nbsp;&nbsp;" +
                "<a href='" + releaseURL + "' target='_blank'>" + releaseTag + "</a>" +
                releaseBadge + "</h3>" + "<hr class='release-hr'>";

                html_sf += "<h4><span class='glyphicon glyphicon-info-sign'></span>&nbsp;&nbsp;" +
                "Release Info</h4>";

            if (sourceforge_release_exist) { 
                html_sf += "<ul>";
                if (releaseAuthor) {
                    html_sf += "<li><span class='glyphicon glyphicon-user'></span>&nbsp;&nbsp;" +
                        "Author: <a href='" + releaseAuthor.html_url + "'>@" + releaseAuthor.login  +"</a></li>";
                }

                html_sf += "<li><span class='glyphicon glyphicon-calendar'></span>&nbsp;&nbsp;" +
                    "Published: " + publishDate + "</li>";


                html_sf += "<li><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
                    "Downloads: " + formatNumber(sf_releaseTotalDownloadCount) + "</li>";

                html_sf += "</ul>";

                html_sf += sf_downloadInfoHTML;

            } else {
                if (releaseAssets.length == 6 ) {
                    html_sf += "<div id='nodata' style='height:352px'><h1>No data<h1></div>";
                } else {
                    html_sf += "<div id='nodata'><h1>No data<h1></div>";
                }
            }

            html_sf += "</div>";

        });

        if(totalDownloadCount) {
            var totalHTML = "<div class='row total-downloads'>";
            totalHTML += "<h1><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;Total Downloads</h1>";
            totalHTML += "<span>" + formatNumber(totalDownloadCount) + "</span>";
            totalHTML += "</div>";

            html_gh = totalHTML + html_gh;
        }

        var headerContainer = "<div class='row header-container'>";
        headerContainer += "<h1>Github</h1>";
        headerContainer += "</div>";
        html_gh = headerContainer + html_gh;
        html_gh += "</div>";


        // Sourceforge total count header
        var totalHTML = "<div class='row total-downloads'>";
        totalHTML += "<h1><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;Total Downloads</h1>";
        totalHTML += "<span>" + formatNumber(sfmainproject.data.total) + "</span>";
        totalHTML += "</div>";
        html_sf = totalHTML + html_sf;   
        headerContainer = ""     
        headerContainer = "<div class='row header-container'>";
        headerContainer += "<h1>Sourceforge</h1>";
        headerContainer += "</div>";
        html_sf = headerContainer + html_sf;
        html_sf += "</div>";

    }

    var resultDiv = $("#gh-stats-result");
    resultDiv.hide();
    resultDiv.html(html_gh);
    $("#loader-gif").hide();
    resultDiv.slideDown();

    var resultDiv = $("#sf-stats-result");
    resultDiv.hide();
    resultDiv.html(html_sf);
    $("#loader-gif").hide();
    resultDiv.slideDown();

}

// Callback function for getting release stats
function getStats(page, perPage) {
    var user = $("#username").val();
    var repository = $("#repository").val();
    var url = apiRoot + "repos/" + user + "/" + repository + "/releases" +
        "?page=" + page + "&per_page=" + perPage;

    $.getJSON(url, showStats).fail(showStats);
}

// Redirection function
function redirect(page, perPage) {
    window.location = "?username=" + $("#username").val() +
        "&repository=" + $("#repository").val() +
        "&sourceforge=" + $("#sourceforge").val() +
        "&page=" + page + "&per_page=" + perPage +
        ((getQueryVariable("search") == "0") ? "&search=0" : "");
}

// The main function
$(function() {
    $("#loader-gif").hide();

    validateInput();
    $("#username, #repository, #sourceforge").keyup(validateInput);

    $("#username").change(getUserRepos);

    $("#get-stats-button").click(function() {
        redirect(page, perPage);
    });

    $("#get-prev-results-button").click(function() {
        redirect(page > 1 ? --page : 1, perPage);
    });

    $("#get-next-results-button").click(function() {
        redirect(++page, perPage);
    });

    $("#per-page select").on('change', function() {
        if(username == "" && repository == "") return;
        redirect(page, this.value);
    });

    var username = getQueryVariable("username");
    var repository = getQueryVariable("repository");
    var sourceforge = getQueryVariable("sourceforge");
    var showSearch = getQueryVariable("search");
    var page = getQueryVariable("page") || 1;
    var perPage = getQueryVariable("per_page") || 5;

    if(username != "" && repository != "") {
        $("#username").val(username);
        $("#title .username").text(username);
        $("#repository").val(repository);
        $("#title .repository").text(repository);
        $("#sourceforge").val(sourceforge);
        $("#title .sourceforge").text(sourceforge);
        $("#per-page select").val(perPage);
        validateInput();
        getUserRepos();
        $(".output").hide();
        $("#description").hide();
        $("#loader-gif").show();
        getStats(page, perPage);
        
        if(showSearch == "0") {
            $("#search").hide();
            $("#description").hide();
            $("#title").show();
        }
    } else {
        $("#username").focus();
    }
});