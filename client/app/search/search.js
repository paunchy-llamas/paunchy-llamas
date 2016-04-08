
angular.module('codellama.search', [])

  .service('SearchService', function($http) {

    // TODO: figure out which query to search by
    this.getTutors = function(query) {

      // TODO: make sure to get api url from server side
      // make GET request to api (db) to get tutor data array
      return $http({
        method: 'GET',
        url: '/api/tutors/all'
      })
      .then(function (resp) {
        console.log(resp.data);
        return resp.data;
      });
    };
  })

  .controller('SearchController', function ($scope, SearchService) {

    // initialize empty tutor data array that will hold search results
    $scope.tutorData = [];

    // define search on scope
    $scope.search = function(query) {

      // call function from SearchService
      SearchService.getTutors(query)

        // upon success, assign returned tutors data to scope's tutorData
        .then(function(tutors) {
          $scope.tutorData = tutors;
        })

        // on error, console log error
        .catch(function(error) {
          console.log('There was an error retrieving tutor data: ', error);
        });
    };

  });