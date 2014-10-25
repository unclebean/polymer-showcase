
angular.module('app', ['ngRoute']);
angular.module('app').run([
    '$rootScope','$location', '$routeParams',
    function($rootScope, $location, $routeParams){
        $rootScope.history = [];
        $rootScope.$on('$routeChangeSuccess', function(e, current, pre) {
            $rootScope.history.push($location.path());
            /*console.log('Current route name: ' + $location.path());
             console.log($routeParams);*/
        });

        $rootScope.getPreviously = function(){

        };
        $rootScope.gotoHomepage = function(){
            $location.path('/');
        };
        $rootScope.gotoPreviously = function(){
            try{
                window.history.back();
            }catch(e){
                history.go(-1);
            }
        };

    }
]);
angular.module('app').config(function($routeProvider){
    $routeProvider.when('/', {controller:'StartStoryController', templateUrl:'views/start.tpl.html'}).
        when('/storyboard/:team', {controller:'TeamBoardController', templateUrl:'views/team.tpl.html'}).
        otherwise({
            redirectTo:'/'
        });
});

angular.module('app').controller('StartStoryController', [
    '$scope', '$rootScope','$location',
    function($scope, $rootScope, $location){
        function init(){
            $scope.isInvalid = false;
            $scope.teamName = '';
        }

        init();

        $scope.$on('$viewContentLoaded', function(){
            //console.log('>>>'+$scope.quality);
        });

        $scope.start = function(){
            // TODO
            /*cannot data bind angular value with polymer paper input, for now get value from DOM*/
            var _teamName = document.getElementById('teamName').value;
            if(_teamName.length === 0){
                $scope.isInvalid = true;
            }else{
                $scope.isInvalid = false;
                $location.path('/storyboard/'+_teamName);
            }
        };
    }
]);

angular.module('app').controller('TeamBoardController', [
    '$scope', '$rootScope', '$route',
    function($scope, $rootScope, $route){
        function init(){
            $rootScope.navTitle = $route.current.params.team;
            $rootScope.showBoard = true;
            $rootScope.toolbarClass = 'medium-tall';
        }

        init();
    }
]);
