function EntryCtrl($scope, $http){

}

function DocCtrl($scope, $http){
  console.log("got here!");
  var uri = '/api/docs/Home';
  $http.get(uri)
    .success(function(data, status, headers, config){
      console.log("got here too!");
      console.log(data);
      $scope.content = data;
      //$scope.showControls = true;
      //$scope.selectSong($scope.songs[0]);
    })
    .error(function(data, status, headers, config) {
      console.log("got here :(!");
      console.log(data);
      console.log(status);
    });
}
