var $userpanel, $welcome, $username, $input, $uid;
var $submit, $countdown;
var $problem_panel, $question, $options;
var $score_panel, $congratulation, $score_display, $score_value;

var submitting = false;

var problemId = 0, answered = false, answer = -1, grades = 0;
var count_down_interval, startTime, displayedTime;

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
                            $score_panel.fadeOut(config.animation.fadeOut, function() {
                                $userpanel.show();
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
    $.ajax({
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
            startTime = Date.now();
            displayedTime = config.quiz.count_down;
            $countdown.html(displayedTime);
            $countdown.show({
                duration: 100,
                complete: function() {
                    count_down_interval = setInterval(function () {
                        var currentTime = config.quiz.count_down - Math.ceil((Date.now() - startTime) / 1000) + 1;
                        if (currentTime != displayedTime) {
                            // Show next number
                            // console.log(currentTime);
                            displayedTime = currentTime;
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
    // TODO: ERROR HANDLE

    // Hide user panel
    $userpanel.fadeOut();
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

    // Determine answer
    console.log(index == answer);
    if (index == answer) {
        // TODO FIX √ X
        $($options.children()[index]).addClass('true');
        var delta = config.quiz.score_base + config.quiz.score_time_bonus * displayedTime;
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
    $userpanel = $('.user_panel');   

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

    $score_panel.hide();

    // Check database connectivity
    $.ajax({
        url: config.endpoint.status,
        method: 'GET',
        success: function(data) {
            if (data[config.status.connectivity_field_name]) {
                $('.connectivity').fadeOut();
                console.log('Database connected');
            } else {
                console.log('Database NOT connected');
            }
        },
        // TODO: ERROR HANDLE
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
                $.ajax({
                    url: config.endpoint.user,
                    method: 'POST',
                    data: {
                        username: username,
                        uid: uid
                    },
                    success: function () {
                        // On POST success
                        $submit.fadeOut(config.animation.fadeOut);
                        $welcome.fadeOut(config.animation.fadeOut, function () {
                            // After $welcome faded out
                            window.localStorage['username'] = username;
                            initializeInitialPage();
                        });
                        $username.html(username);
                    },
                    complete: function () {
                        submitting = false;
                    }
                });
                // TODO: ERROR HANDLE
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