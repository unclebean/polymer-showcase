var app = angular.module('app', ['ngRoute','ng-polymer-elements', 'angularSpinner']);
app.run([
    '$rootScope','$location', '$routeParams', 'usSpinnerService',
    function($rootScope, $location, $routeParams, usSpinnerService){
        $rootScope.history = [];
        $rootScope.toastMessage = null;
        $rootScope.isLoading = false;
        $rootScope.currentUser = null;
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
            login($scope.username, $scope.password).then(function(user){
                $scope.isInvalidUser = false;
                $scope.isInvalidPassword = false;
                $rootScope.currentUser = user;
                $rootScope.stopLoading();
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

app.controller('RegisterController',['$scope', '$rootScope', '$route', '$location', 'signUp', function($scope, $rootScope, $route, $location, signUp){
    function init(){
        $scope.email = '';
        $scope.username = '';
        $scope.password = '';
        $scope.confirmpwd = '';
    };

    $scope.reg = function(){
        var _photoGroup = document.querySelector('#photoGroup');
        var _photo = _photoGroup.selectedItem.getValue();
        if(0 === $scope.email.length || 0 === $scope.username.length 
            || 0 === $scope.password.length || $scope.password !== $scope.confirmpwd){
            $rootScope.showToastWithMsg("Register user error!");
            return false;
        }
        signUp(_photo, $scope.email, $scope.username, $scope.password).then(function(result){
            $rootScope.showToastWithMsg(result);
            $rootScope.gotoPreviously();
        }, function(err){
            $rootScope.showToastWithMsg(err);
        });

    };

    $scope.back = function(){
        $rootScope.gotoPreviously();
    };

    init();
}]);

app.controller('TeamBoardController', [
    '$scope', '$rootScope', '$route', '$location', '$sce', 'createProject', 'projects', 'allUsers', 'addTask', 'updateTask', 'getAllTaskWithProjectName',
    function($scope, $rootScope, $route, $location, $sce, createProject, projects, allUsers, addTask, updateTask, getAllTaskWithProjectName){
        function init(){
            try {
                $scope.navTitle = $route.current.params.team;
                $scope.userPhoto = $sce.trustAsResourceUrl('./images/'+$rootScope.currentUser.photo+'.png');
                $scope.newProjectName = '';
                $scope.projects = projects();
                $scope.taskTypes = _initTasktyps();
                $scope.users = _initUsers();
                $scope.currentProject = null;
                $scope.tempNewTask = null;
                
                $scope.taskViewList = [];

                for($scope.currentProject in $scope.projects){
                    break;
                }
                $scope.selectProject($scope.currentProject);
                var _board = document.querySelector('#board');
                _board.addEventListener('core-select', function(ev){
                    var _taskType = Task.TASK_STATUS[ev.target.selected];
                    for(var i= 0,len=$scope.taskViewList.length; i<len; i++){
                        $scope.taskViewList[i].shouldHidden(_taskType);
                    }
                });
            }catch(e){
                $rootScope.showToastWithMsg("Encounter error!");
                $location.path('/');
            }
        };
        function _initTasktyps(){
            var _tasktypes = {};
            for(var i= 0, len=Task.TASK_TYPE.length; i<len; i++){
                _tasktypes[Task.TASK_TYPE[i]] = $sce.trustAsResourceUrl('./images/'+Task.TASK_TYPE[i]+'.png');
            }
            return _tasktypes;
        };
        function _initUsers(){
            var _users = [];
            for(var i=0, len=allUsers.length; i<len; i++){
                var _u = allUsers[i];
                _u = new User(_u.email, _u.username, _u.photo);
                _u.setPhotoUrl($sce.trustAsResourceUrl('./images/'+_u.photo+'.png'));
                _users.push(_u);
            }
            return _users;
        };
        function _initTaskView(task, defautStatus){
            var _taskView = new StoryTask();

            _taskView.task = task;
            _taskView.addEventListener('process-task', $scope.processTaskHandler);
            _taskView.shouldHidden(defautStatus);
            $scope.taskViewList.push(_taskView);
            document.querySelector('.task-container').appendChild(_taskView);
        };
        $scope.selectProject = function(project){
            if(project){
                $scope.currentProject = project;
                var _taskContainerDOM = document.querySelector('.task-container');
                while(_taskContainerDOM.firstChild){
                    _taskContainerDOM.removeChild(_taskContainerDOM.firstChild);
                }
                $scope.taskViewList.length = 0;
                var _taskList = getAllTaskWithProjectName(project);
                for(var i=0, len=_taskList.length; i<len; i++){
                    _initTaskView(_taskList[i], 'TODO');
                }
                document.querySelector('#board').selected = 0;
            }
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
        $scope.toggleTaskDialog = function(){
            $scope.tempNewTask = new Task();
            document.querySelector('#new-task').toggle();
        };
        $scope.createProject = function(){
            if($scope.newProjectName.length === 0){
                $rootScope.showToastWithMsg('Project name can not empty!');
                return false;
            }

            createProject($scope.newProjectName).then(function(result){
                $rootScope.showToastWithMsg(result);
                $scope.projects[$scope.newProjectName] = [];
                if(null === $scope.currentProject){
                    $scope.currentProject = $scope.newProjectName;
                }
                $scope.toggleDialog();
            }, function(err){
                $rootScope.showToastWithMsg(err);
            });
        };
        $scope.createTask = function(){
           $scope.toggleTaskDialog();
        };
        $scope.addNewTask = function(){

            try{
                var _taskType = document.querySelector('#taskType').selectedItem,
                    _taskOwner = document.querySelector('#taskOwner').selectedItem,
                    _newTaskName = $scope.tempNewTask.name,
                    _newTaskDesc = $scope.tempNewTask.desc,
                    _estimate = parseFloat($scope.tempNewTask.estimate);

                if(0 === _newTaskName.trim().length || 0 === _newTaskDesc.trim().length
                    || 0 === _taskType.label.length || 0 === _taskOwner.label.length
                    || _estimate <= 0){
                    throw 'error';
                }
                $scope.tempNewTask.estimate = _estimate;
                $scope.tempNewTask.type = _taskType.label;
                $scope.tempNewTask.owner = _taskOwner.label;
                $scope.tempNewTask.setOwnerPhotoUrl(_taskOwner.src);
                $scope.tempNewTask.setTaskIconUrl(_taskType.src);
  
                _initTaskView($scope.tempNewTask, 'TODO');

                addTask($scope.currentProject, $scope.tempNewTask).then(function(newTaskList){
                    document.querySelector('#board').selected = 0;
                }, function(err){});
            }catch(e){
                $rootScope.showToastWithMsg("Can not create new task!");
            }
        };
        $scope.processTaskHandler = function(taskView){
            var _selectedIndex = document.querySelector('#board').selected;
            taskView.currentTarget.shouldHidden(Task.TASK_STATUS[parseInt(_selectedIndex)]);
            updateTask($scope.currentProject, taskView.currentTarget.task);
        };
        init();
    }
]);



app.factory('localStorage', function(){
    return window.localStorage;
});

app.factory('signUp', ['$q', 'localStorage', function($q, localStorage){
    return function(photo, email, username, password){
        var _defer = $q.defer();
        try{
            var _users = localStorage.users, _result = 'success';
            _users = undefined === _users? []: JSON.parse(_users);

            for(var i=0,len=_users.length; i<len; i++){
                var _user = _users[i];
                if(email === _user.email){
                    throw 'The email address have been used.';
                }
                if(username === _user.username){
                    throw 'The username have bean used.';
                }
            }

            _users.push({'photo':photo, 'email':email,'username':username,'password':password});
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
                    _defer.resolve(new User(_user.email, _user.username, _user.photo));
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

app.factory('allUsers', ['localStorage', function(localStorage){
    return JSON.parse(localStorage.users);
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
    return function(){
        var _projects = localStorage.projects;
        
        _projects = undefined === _projects? {} : JSON.parse(_projects);

        return _projects;
    }
}]);

app.factory('addTask',['$q', 'localStorage', function($q, localStorage){
    return function(projectName, task){
        var _defer = $q.defer();
        try{
            var _projects = localStorage.projects, project=null;
            _projects = undefined === _projects ? {} : JSON.parse(_projects);
            for(project in _projects){
                if(projectName === project){
                    task.id = _projects[projectName].length+1;
                    _projects[projectName].push(task);
                    break
                }
            }
            localStorage.setItem('projects', JSON.stringify(_projects));
            _defer.resolve(_projects[projectName]);
        }catch(e){
            _defer.reject("Create task error!");
        }finally{
            return _defer.promise;
        }
    }
}]);

app.factory('updateTask', ['$q', 'localStorage', function($q, localStorage){
    return function(projectName, task){
        var _projects = localStorage.projects, project=null;
            _projects = undefined === _projects ? {} : JSON.parse(_projects);
        var _taskList = _projects[projectName];
        for(var i=0,len=_taskList.length; i<len; i++){
            var _task = _taskList[i];
            if(_task.id === task.id){
                _taskList[i] = task;
                break;
            }
        }
        localStorage.setItem('projects', JSON.stringify(_projects));
    };
}]);

app.factory('getAllTaskWithProjectName', ['$q', 'projects', function($q, projects){
    return function(projectName){
        var _taskList = projects()[projectName], _taskInstanceList = [];
        for(var i=0,len=_taskList.length; i<len; i++){
            var _taskOrigin = _taskList[i],
                _taskInstance = new Task();
            _taskInstance.name = _taskOrigin.name;
            _taskInstance.type = _taskOrigin.type;
            _taskInstance.status = _taskOrigin.status;
            _taskInstance.desc = _taskOrigin.desc;
            _taskInstance.owner = _taskOrigin.owner;
            _taskInstance.estimate = _taskOrigin.estimate;
            _taskInstance.taskIconUrl = _taskOrigin.taskIconUrl;
            _taskInstance.ownerPhotoUrl = _taskOrigin.ownerPhotoUrl;
            _taskInstance.id = _taskOrigin.id;
            _taskInstanceList.push(_taskInstance);
        }
        return _taskInstanceList;
    };
}]);


var User = function(email, username, photo){
    this.email = email;
    this.username = username;
    this.photo = User.PHOTO_DIC.indexOf(photo) >= 0 ? photo : 'default_user';
};

User.PHOTO_DIC = ['default_user', 'fullbeard', 'girl'];

User.prototype = {
    setPassword:function(password){},
    setConfirmPwd:function(confirmPwd){},
    setPhotoUrl:function(url){this.photoUrl = url;}
};

var Task = function(name, type, desc, status, owner, estimate){
    this.name = name;
    this.type = Task.TASK_TYPE.indexOf(type) >= 0 ? type : 'Bug';
    this.desc = desc;
    this.status = Task.TASK_STATUS.indexOf(status) >=0 ? status : 'TODO';
    this.owner = owner;
    this.estimate = estimate;
    this.ownerPhotoUrl = null;
    this.taskIconUrl = null;
    this.id = null;
};

Task.TASK_TYPE = ['bug', 'feature', 'improvement'];
Task.TASK_STATUS = ['TODO', 'DOING', 'DONE'];

Task.prototype = {
    assign:function(owner){},
    toggleStatus:function(){
        var _index = Task.TASK_STATUS.indexOf(this.status);
        if(2 !== _index){
            this.status = Task.TASK_STATUS[_index+1];
        }
    },
    setOwnerPhotoUrl:function(url){this.ownerPhotoUrl = url;},
    setTaskIconUrl:function(url){this.taskIconUrl = url;},
    updateName:function(newName){},
    updateType:function(newType){},
    updateDesc:function(newDesc){}
};
