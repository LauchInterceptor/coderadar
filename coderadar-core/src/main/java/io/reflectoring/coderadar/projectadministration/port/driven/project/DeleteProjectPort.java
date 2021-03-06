package io.reflectoring.coderadar.projectadministration.port.driven.project;

public interface DeleteProjectPort {

  /**
   * Deletes a project from the database.
   *
   * @param projectId The id of the project to delete.
   */
  void delete(Long projectId);
}
