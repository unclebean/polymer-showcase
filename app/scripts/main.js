var app = angular.module('app', ['ngRoute','ng-polymer-elements', 'angularSpinner']);
app.run([
    '$rootScope','$location', '$routeParams', 'usSpinnerService',
    function($rootScope, $location, $routeParams, usSpinnerService){
        $rootScope.history = [];
        $rootScope.toastMessage = null;
        $rootScope.isLoading = false;
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
        $rootScope.showToastWithMsg = function(message){
            $rootScope.toastMessage = message;
            document.querySelector('#commonToast').show();
        };
        $rootScope.loading = function(){
            $rootScope.isLoading = true;
            usSpinnerService.spin('spinner');
        };
        $rootScope.stopLoading = function(){
            $rootScope.isLoading = false;
            usSpinnerService.stop('spinner');
        };
    }
]);
app.config(function($routeProvider){
    $routeProvider.when('/', {controller:'StartStoryController', templateUrl:'views/start.tpl.html'})
                  .when('/register', {controller:'RegisterController', templateUrl:'views/register.tpl.html'})
                  .when('/storyboard/:team', {controller:'TeamBoardController', templateUrl:'views/team.tpl.html'})
                  .otherwise({
                    redirectTo:'/'
                  });
});

app.controller('StartStoryController', [
    '$scope', '$rootScope','$location', 'login',
    function($scope, $rootScope, $location, login){
        function init(){
            $scope.isInvalidUser = false;
            $scope.isInvalidPassword = false;
            $scope.username = '';
            $scope.password = '';
        }

        init();

        $scope.$on('$viewContentLoaded', function(){
            //console.log('>>>'+$scope.quality);
        });

        $scope.login = function(){

            if(0 === $scope.username.length){
                $scope.isInvalidUser = true;
                return false;
            }
            if(0 === $scope.password.length){
                $scope.isInvalidPassword = true;
                return false;
            }
            $rootScope.loading();
            login($scope.username, $scope.password).then(function(result){
                $scope.isInvalidUser = false;
                $scope.isInvalidPassword = false;
                setTimeout(function(){
                    $rootScope.stopLoading();

                }, 100);
                $location.path('/storyboard/'+$scope.username);
            }, function(err){
                $rootScope.stopLoading();
                $rootScope.showToastWithMsg(err);
            });
        };
        $scope.signup = function(){
            $location.path('/register');
        };
    }
]);

app.controller('RegisterController',['$scope', '$rootScope', '$route', 'signUp', function($scope, $rootScope, $route, signUp){
    function init(){
        $scope.email = null;
        $scope.username = null;
        $scope.password = null;
        $scope.confirmpwd = null;
    };

    $scope.reg = function(){
        var _result = signUp($scope.email, $scope.username, $scope.password).then(function(result){
            $rootScope.showToastWithMsg(result);
            $location.path('/storyboard/'+$scope.username);
        }, function(err){
            $rootScope.showToastWithMsg(err);
        });
    }

    init();
}]);

app.controller('TeamBoardController', [
    '$scope', '$rootScope', '$route', 'createProject', 'projects',
    function($scope, $rootScope, $route, createProject, projects){
        function init(){
            $scope.navTitle = $route.current.params.team;
            $scope.manageProjectIcon = "settings";
            $scope.newProjectName = '';
            $scope.projects = projects;
        };
        $scope.openDrawer = function(){
            document.querySelector('#storyBoard').openDrawer();
        };
        $scope.closeDrawer = function(){
            document.querySelector('#storyBoard').closeDrawer();
        };
        $scope.toggleDialog = function(){
            document.querySelector('#new-project').toggle();
        };
        $scope.createProject = function(){
            if($scope.newProjectName.length === 0){
                $rootScope.showToastWithMsg('Project name can not empty!');
                return false;
            }

            createProject($scope.newProjectName).then(function(result){
                $rootScope.showToastWithMsg(result);
                $scope.projects[$scope.newProjectName] = [];
                $scope.toggleDialog();
            }, function(err){
                $rootScope.showToastWithMsg(err);
            });
        };
        init();
    }
]);



app.factory('localStorage', function(){
    return window.localStorage;
});

app.factory('signUp', ['$q', 'localStorage', function($q, localStorage){
    return function(email, username, password){
        var _defer = $q.defer();
        try{
            var _users = localStorage.users, _result = 'success';
            _users = undefined === _users? []: JSON.parse(_users);

            for(var i=0,len=localStorage.length; i<len; i++){
                var _user = localStorage[i];
                if(email === _user.email){
                    throw 'The email address have been used.';
                }
                if(username === _user.username){
                    throw 'The username have bean used.';
                }
            }

            _users.push({'email':email,'username':username,'password':password});
            localStorage.setItem('users', JSON.stringify(_users));
            _defer.resolve(_result);
        }catch(e){
            _defer.reject(e);
        }finally {
            return _defer.promise;
        }
    }
}]);

app.factory('login', ['$q', 'localStorage', function($q, localStorage){
    return function(username, password){
        var _defer = $q.defer();
        try{
            var _users = localStorage.users, _result = 'failed';
            _users = undefined === _users? []: JSON.parse(_users);

            for(var i= 0,len=_users.length; i<len; i++){
                var _user = _users[i];
                if(username === _user.username && password === _user.password){
                    _result = 'success';
                    _defer.resolve(_result);
                    break;
                }
            }

            if('failed' === _result){
                throw 'Wrong username or password!';
            }
        }catch(e){
            _defer.reject(e);
        }finally{
            return _defer.promise;
        }
    };
}]);

app.factory('createProject', ['$q', 'localStorage', function($q, localStorage){
    return function(projectName){
        var _defer = $q.defer();
        try{
            var _projects = localStorage.projects, _result = 'success', project=null;
            _projects = undefined === _projects ? {} : JSON.parse(_projects);
            for(project in _projects){
                if(projectName === project){
                    throw 'The project exists!';
                }
            }
            _projects[projectName] = [];
            localStorage.setItem('projects', JSON.stringify(_projects));
            _defer.resolve(_result);
        }catch(e){
            _defer.reject(e);
        }finally{
            return _defer.promise;
        }
    };
}]);

app.factory('projects',['localStorage', function(localStorage){
    return JSON.parse(localStorage.projects);
}]);
