package io.reflectoring.coderadar.rest.query;

import io.reflectoring.coderadar.query.port.driver.GetMetricTreeForCommitUseCase;
import io.reflectoring.coderadar.query.port.driver.GetMetricsForCommitCommand;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Transactional
public class GetMetricsForAllFilesInCommitController {
  private final GetMetricTreeForCommitUseCase getMetricTreeForCommitUseCase;

  public GetMetricsForAllFilesInCommitController(
      GetMetricTreeForCommitUseCase getMetricTreeForCommitUseCase) {
    this.getMetricTreeForCommitUseCase = getMetricTreeForCommitUseCase;
  }

  @GetMapping(path = "/projects/{projectId}/metricvalues/tree", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity getMetricValues(@Validated @RequestBody GetMetricsForCommitCommand command, @PathVariable("projectId") Long projectId){
    return new ResponseEntity<>(getMetricTreeForCommitUseCase.get(command, projectId), HttpStatus.OK);
  }
}
