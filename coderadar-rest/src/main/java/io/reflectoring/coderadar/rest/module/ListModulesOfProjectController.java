package io.reflectoring.coderadar.rest.module;

import io.reflectoring.coderadar.projectadministration.port.driver.module.get.ListModulesOfProjectUseCase;
import io.reflectoring.coderadar.rest.domain.GetModuleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@Transactional
public class ListModulesOfProjectController {
  private final ListModulesOfProjectUseCase listModulesOfProjectUseCase;

  public ListModulesOfProjectController(ListModulesOfProjectUseCase listModulesOfProjectUseCase) {
    this.listModulesOfProjectUseCase = listModulesOfProjectUseCase;
  }

  @GetMapping(path = "/projects/{projectId}/modules", produces = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<List<GetModuleResponse>> listModules(@PathVariable Long projectId) {
    return new ResponseEntity<>(listModulesOfProjectUseCase.listModules(projectId).stream().map(module ->
            new GetModuleResponse(module.getId(), module.getPath())).collect(Collectors.toList()), HttpStatus.OK);
  }
}
