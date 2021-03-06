import {Component, OnInit} from '@angular/core';
import {Project} from '../../model/project';
import {ProjectService} from '../../service/project.service';
import {Router} from '@angular/router';
import {UserService} from '../../service/user.service';
import {FORBIDDEN, UNPROCESSABLE_ENTITY} from 'http-status-codes';
import {Title} from '@angular/platform-browser';
import {AppComponent} from '../../app.component';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-main-dashboard',
  templateUrl: './main-dashboard.component.html',
  styleUrls: ['./main-dashboard.component.scss']
})
export class MainDashboardComponent implements OnInit {

  projects: Project[] = [];

  appComponent = AppComponent;
  waiting = false;

  constructor(private snackBar: MatSnackBar, private titleService: Title, private userService: UserService,
              private router: Router, private projectService: ProjectService) {
    titleService.setTitle('Coderadar - Dashboard');
  }

  ngOnInit(): void {
    this.getProjects();
  }

  /**
   * Deletes a project from the database.
   * Only works if project is not currently being analyzed.
   * @param project The project to delete
   */
  deleteProject(project: Project): void {
    this.projectService.deleteProject(project.id)
      .then(() => {
        const index = this.projects.indexOf(project, 0);
        if (this.projects.indexOf(project, 0) > -1) {
          this.projects.splice(index, 1);
        }
      })
      .catch(error => {
        if (error.status && error.status === FORBIDDEN) {
          this.userService.refresh(() => this.deleteProject(project));
        } else if (error.status && error.status === UNPROCESSABLE_ENTITY) {
          this.openSnackBar('Cannot delete project! Try again later!', '🞩');
        }
      });
  }

  /**
   * Gets all projects from the project service and constructs a new array of Project objects
   * from the returned JSON. Sends a refresh token if access is denied.
   */
  private getProjects(): void {
    this.waiting = true;
    this.projectService.getProjects()
      .then(response => {response.body.forEach(project => {
        const newProject = new Project(project);
        this.projects.push(newProject);
        });
                         this.waiting = false;
        }
      )
      .catch(e => {
        if (e.status && e.status === FORBIDDEN) {
          this.userService.refresh(() => this.getProjects());
        }
      });
  }

  startAnalysis(id: number) {
    this.projectService.startAnalyzingJob(id, true).then(() => {
      this.openSnackBar('Analysis started!', '🞩');
    }).catch(error => {
      if (error.status && error.status === FORBIDDEN) {
        this.userService.refresh(() => this.projectService.startAnalyzingJob(id, true));
      } else if (error.status && error.status === UNPROCESSABLE_ENTITY) {
        if (error.error.errorMessage === 'Cannot analyze project without analyzers') {
          this.openSnackBar('Cannot analyze, no analyzers configured for this project!', '🞩');
        } else if (error.error.errorMessage === 'Cannot analyze project without file patterns') {
          this.openSnackBar('Cannot analyze, no file patterns configured for this project!', '🞩');
        } else {
          this.openSnackBar('Analysis cannot be started! Try again later!', '🞩');
        }
      }
    });
  }

  resetAnalysis(id: number) {
    this.projectService.resetAnalysis(id, true).then(() => {
      this.openSnackBar('Analysis results deleted!', '🞩');
    }).catch(error => {
      if (error.status && error.status === FORBIDDEN) {
        this.userService.refresh(() => this.projectService.resetAnalysis(id, true));
      } else if (error.status && error.status === UNPROCESSABLE_ENTITY) {
        this.openSnackBar('Analysis results cannot be deleted! Try again later!', '🞩');
      }
    });
  }

  openSnackBar(message: string, action: string) {
    this.snackBar.open(message, action, {
      duration: 4000,
    });
  }

  stopAnalysis(id: number) {
    this.projectService.stopAnalyzingJob(id).then(() => {
      this.openSnackBar('Analysis stopped!', '🞩');
    }).catch(error => {
      if (error.status && error.status === FORBIDDEN) {
        this.userService.refresh(() => this.projectService.stopAnalyzingJob(id));
      } else if (error.status && error.status === UNPROCESSABLE_ENTITY) {
        this.openSnackBar('Analysis stopped!', '🞩');
      }
    });
  }
}
