var $userPanel, $welcome, $username, $input, $uid;
var $submit, $countdown;
var $problem_panel, $question, $options;
var $score_panel, $congratulation, $score_display, $score_value;
var $notification;

var submitting = false;

var problemId = 0, answered = false, answer = -1, grades = 0;
var count_down_interval, start_time, displayed_time;
var notification_shown = false, notification_timeout;

function log(content, isError, keepDisplay) {
    // Set error
    if (isError == true) {
        console.error(content);
        $notification.addClass('error');
    } else {
        console.log(content);
        $notification.removeClass('error');
    }

    // Set notification content
    $notification.html(content);

    // Show notification if it is not shown
    if (!notification_shown) {
        notification_shown = true;
        $notification
            .css("left", (window.innerWidth - $notification.outerWidth()) >> 1)
            .fadeIn(config.animation.fadeIn);
        // Set timeout to hide notification if we have no intention to keep it
        if (!keepDisplay) {
            notification_timeout = setTimeout(function() {
                $notification.fadeOut(config.animation.fadeOut, function() {
                    notification_shown = false;
                });
            }, 1000);
        }
    } else {
        // Clear timeout if we need to keep the notification
        if (keepDisplay) {
            clearTimeout(notification_timeout);
        }
    }
}

function ajaxWithRetry(ajaxConfig, retryLimit, retryCount) {
    // Default retry limit
    if (!retryLimit) {
        retryLimit = config.retry.limit;
    }
    if (!retryCount) {
        retryCount = 1;
    }
    // Set retry
    ajaxConfig.error = function(err) {
        if (retryCount < retryLimit) {
            log(err.responseJSON.Message + ' | Retry #' + retryCount, true, false);
            console.error('Retry number ' + retryCount);
            setTimeout(function() {
                ajaxWithRetry(ajaxConfig, retryLimit, retryCount + 1);
            }, config.retry.timeout)
        } else {
            log(err.responseJSON.Message, true, true);
            console.error('Stop retrying');
        }
    }

    // Invoke call
    $.ajax(ajaxConfig);
}

function initializeInitialPage() {
    $welcome.fadeIn(config.animation.fadeIn);

    $submit
        .html(config.text.existing_user.button)
        .unbind("click")
        .click(function() {
            // Start Game

            problemId = 0;
            grades = 0;
            $options.show();
            nextProblem();
        })
        .fadeIn(config.animation.fadeIn);
}

function nextProblem() {
    // Hide previous problem
    $question.hide({duration: 100});
    // Hide options one by one
    new function(index) {
        if (index != 4) {
            $($options.children()[index]).fadeOut();
            var original_function = arguments.callee;
            setTimeout(function () {
                original_function(index + 1);
            }, 100);
        }
    }(0);

    // If there is no more problems
    problemId++;
    if (problemId > config.quiz.problem_count) {
        $countdown.hide();

        // TODO Some animation

        // Set and show grades
        $score_value.html(grades);
        $score_panel.show();
        $congratulation
            .fadeIn(config.animation.fadeIn, function() {
                // Set and show restart game button
                $score_display.fadeIn(config.animation.fadeIn, function () {
                    $submit
                        .html(config.text.play_again.button)
                        .unbind("click")
                        .click(function() {
                            // Hide score panel and display start page
                            $submit.fadeOut();
                            $input.hide();
                            $score_panel.fadeOut(config.animation.fadeOut, function() {
                                $userPanel.show();
                                $username.fadeIn(config.animation.fadeIn);
                                $uid.fadeIn(config.animation.fadeIn);
                                initializeInitialPage();
                            })
                        }).fadeIn();
                });
            });
        return;
    }

    // Query next problem
    ajaxWithRetry({
        url: config.endpoint.problem,
        method: 'GET',
        success: function(data) {
            console.log(data);

            data.options = JSON.parse(data.options);
            answer = data.answer;
            answered = false;

            $question
                .html(problemId + '. ' + data.content)
                .fadeIn(config.animation.fadeIn);

            // Start count down
            start_time = Date.now();
            displayed_time = config.quiz.count_down;
            $countdown.html(displayed_time);
            $countdown.show({
                duration: 100,
                complete: function() {
                    if (count_down_interval != null) {
                        clearInterval(count_down_interval);
                    }
                    count_down_interval = setInterval(function () {
                        var currentTime = config.quiz.count_down - Math.ceil((Date.now() - start_time) / 1000) + 1;
                        if (currentTime < 0) {
                            clearInterval(count_down_interval);
                            count_down_interval = null;
                            return;
                        }
                        if (currentTime != displayed_time) {
                            // Show next number
                            // console.log(currentTime);
                            displayed_time = currentTime;
                            $countdown.hide({
                                duration: 100,
                                complete: function() {
                                    $countdown.html(currentTime);
                                    $countdown.show({
                                        duration: 100,
                                        complete: function() {
                                            // Have count down to 8
                                            if (currentTime == 8) {
                                                new function(index) {
                                                    if (index == 4) {
                                                        return;
                                                    } else {
                                                        $($options.children()[index])
                                                            .removeClass('true')
                                                            .removeClass('false')
                                                            .attr('onclick', 'selectOption(' + index + ');')
                                                            .html(data.options[index])
                                                            .fadeIn();
                                                        var original_function = arguments.callee;
                                                        setTimeout(function () {
                                                            original_function(index + 1);
                                                        }, 100);
                                                    }
                                                }(0);
                                            }
                                            // Have count down to 0
                                            if (currentTime == 0) {
                                                // Stop count_down
                                                clearInterval(count_down_interval);
                                                // Display answer
                                                $($options.children()[answer]).addClass('true');
                                                // Next round
                                                setTimeout(nextProblem, 3000);
                                            }
                                        }
                                    });
                                },
                            });
                        }
                    }, 100);
                },
            });
        },
    });

    // Hide user panel
    $userPanel.fadeOut();
    $submit.fadeOut();
}

// Referenced by inline 'onclick'
function selectOption(index) {
    if (answered) {
        return;
    }
    answered = true;

    // Stop timer
    clearInterval(count_down_interval);
    count_down_interval = null;

    // Determine answer
    console.log(index == answer);
    if (index == answer) {
        // TODO FIX √ X
        $($options.children()[index]).addClass('true');
        var delta = config.quiz.score_base + config.quiz.score_time_bonus * displayed_time;
        console.log(delta);
        grades += delta;
    } else {
        $($options.children()[index]).addClass('false');
        $($options.children()[answer]).addClass('true');
    }

    // Next round
    setTimeout(nextProblem, 3000);
}

$(function () {
    // console.log(config);
    $userPanel = $('.user_panel');

    $welcome = $('.user_panel div#welcome');
    $username = $('.user_panel div#username');
    $input = $('.user_panel input');
    $uid = $('.user_panel div#uid');

    $submit = $('div#submit');
    $countdown = $('div#count_down');

    $problem_panel = $('.problem_panel');
    $question = $('.problem_panel .question');
    $options = $('.problem_panel .options');

    $score_panel = $('.score_panel');
    $score_value = $('.score_panel div font');
    $congratulation = $('.score_panel div:nth-of-type(1)');
    $score_display = $('.score_panel div:nth-of-type(2)');

    $notification = $("#notification");

    $score_panel.hide();
    $notification.hide();

    // Check database connectivity
    ajaxWithRetry({
        url: config.endpoint.status,
        method: 'GET',
        success: function(data) {
            if (data[config.status.connectivity_field_name]) {
                $('.connectivity').fadeOut();
                console.log('Database connected');
            } else {
                if (config.status.block_login_without_database) {
                    $input.attr('disabled', 'true');
                    $submit
                        .unbind("click")
                        .attr('disabled', 'true');
                    log('Database not connected, login blocked.', true, true);
                }
                console.log('Database NOT connected');
            }
        },
    });

    // Fetch UID from HTML5 local storage
    var uid = window.localStorage['uid'];
    if (!uid) {
        // Generate an UID if UID not exist
        uid = UUID.generate();
        window.localStorage['uid'] = uid;
    }
    // Set uid display
    console.log(uid);
    $uid.html(uid);

    //Fetch username from HTML5 local storage
    var username = window.localStorage['username'];
    if (!username) {
        $welcome.html(config.text.new_user.description);
        console.log(config.text.new_user.description);
        
        $submit.html(config.text.new_user.button);
        $submit
            .unbind("click")
            .click(function() {
                if (submitting) {
                    return;
                }
                submitting = true;

                $input.attr('disabled', 'true');
                username = $input.val();

                // Submit username
                ajaxWithRetry({
                    url: config.endpoint.user,
                    method: 'POST',
                    data: {
                        username: username,
                        identifier: uid,
                    },
                    success: function () {
                        // On POST success
                        $submit.fadeOut(config.animation.fadeOut);
                        $welcome.fadeOut(config.animation.fadeOut, function () {
                            // After $welcome faded out
                            $welcome.html(config.text.new_user.notification);
                            window.localStorage['username'] = username;
                            initializeInitialPage();
                        });
                        $username.html(username);
                    },
                    complete: function () {
                        submitting = false;
                    }
                });
            });

        $welcome.fadeIn();
        $username.hide();
        $input.fadeIn();
        $uid.fadeIn();
        $submit.fadeIn();
    } else {
        $welcome.html(config.text.existing_user.notification);
        console.log(config.text.existing_user.notification);

        $input.hide();
        $username.html(username);
        $username.fadeIn(config.animation.fadeIn);

        $uid.fadeIn(config.animation.fadeIn);

        initializeInitialPage();
    }

})

// Tool function to reset local storage
function reset() {
    delete window.localStorage['uid'];
    delete window.localStorage['username'];
    location.reload();
}
