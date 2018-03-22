var config = {
    text: {
        new_user: {
            description: "Please choose a username",
            button: "Confirm",
            notification: "Welcome",
        },
        existing_user: {
            button: "Start",
            notification: "Welcome back",
        },
        play_again: {
            button: "Play Again"
        }
    },
    animation: {
        fadeIn: 300,
        fadeOut: 300,
    },
    display: {
        user_panel: {
            font_size_default: 20,
            font_size_small: 12,
            width: 280,
        },
        button: {
            width: 150,
            height: 30,
            padding: 5,
            font_size: 20,
        }
    },
    endpoint: {
        user: '/api/user',
        problem: '/api/problems/0'
    },
    quiz: {
        problem_count: 3,
        count_down : 10,
        score_base: 50,
        score_time_bonus: 10,
    }
};