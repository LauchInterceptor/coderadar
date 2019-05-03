package io.reflectoring.coderadar.rest.unit.module;

import io.reflectoring.coderadar.core.projectadministration.port.driver.module.update.UpdateModuleCommand;
import io.reflectoring.coderadar.core.projectadministration.port.driver.module.update.UpdateModuleUseCase;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class UpdateModuleController {
  private final UpdateModuleUseCase updateModuleUseCase;

  @Autowired
  public UpdateModuleController(UpdateModuleUseCase updateModuleUseCase) {
    this.updateModuleUseCase = updateModuleUseCase;
  }

  @PostMapping(path = "/projects/{projectId}/modules/{moduleId}")
  public ResponseEntity<String> updateModule(
      @RequestBody UpdateModuleCommand command, @PathVariable(name = "moduleId") Long moduleId) {
    updateModuleUseCase.updateModule(command, moduleId);
    return new ResponseEntity<>(HttpStatus.OK);
  }
}
