/******************************/
/*****CUSTOM ICONS & LOGO*****/
/****************************/

//init custom icon ref.

    awlr = L.icon({
        iconUrl: 'assets/awlr.png',
        iconSize: [32, 32]
    });

    arg = L.icon({
        iconUrl: 'assets/arg.png',
        iconSize: [32, 32]
    });

    aws = L.icon({
        iconUrl: 'assets/aws.png',
        iconSize: [32, 32]
    });

    
    
    //function for icon
    function getIcon(dtype){

        if (dtype == "ARG") {

            return arg;
        }
        else if (dtype == "AWS") {

            return aws;
        }
        
        else return awlr;
        
    }
