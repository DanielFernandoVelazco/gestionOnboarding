import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { CorreoService } from '../../../../services/correo.service';
import { HistorialCorreo } from '../../../../types/correo.types';
import { DetalleCorreoComponent } from '../detalle-correo/detalle-correo.component';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-historial-correo',
    templateUrl: './historial-correo.component.html',
    styleUrls: ['./historial-correo.component.scss']
})
export class HistorialCorreoComponent implements OnInit {
    displayedColumns: string[] = [
        'destinatario',
        'asunto',
        'tipo',
        'enviado',
        'fecha_envio',
        'acciones'
    ];
    dataSource = new MatTableDataSource<HistorialCorreo>();

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    filtroForm: FormGroup;
    loading = false;
    totalItems = 0;
    pageSize = 10;
    pageSizeOptions = [5, 10, 25, 50];

    constructor(
        private correoService: CorreoService,
        private dialog: MatDialog,
        private fb: FormBuilder
    ) {
        this.filtroForm = this.fb.group({
            destinatario: [''],
            tipo: [''],
            enviado: [''],
            fechaDesde: [''],
            fechaHasta: ['']
        });
    }

    ngOnInit(): void {
        this.cargarHistorial();

        // Filtro reactivo
        this.filtroForm.valueChanges
            .pipe(
                debounceTime(500),
                distinctUntilChanged()
            )
            .subscribe(() => {
                this.cargarHistorial(1);
            });
    }

    ngAfterViewInit(): void {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
    }

    cargarHistorial(page: number = 1): void {
        this.loading = true;

        const filters = {
            destinatario: this.filtroForm.get('destinatario')?.value,
            tipo: this.filtroForm.get('tipo')?.value,
            enviado: this.filtroForm.get('enviado')?.value !== ''
                ? this.filtroForm.get('enviado')?.value
                : undefined,
            fechaDesde: this.filtroForm.get('fechaDesde')?.value,
            fechaHasta: this.filtroForm.get('fechaHasta')?.value
        };

        this.correoService.obtenerHistorial(page, this.pageSize, filters)
            .subscribe({
                next: (response) => {
                    this.dataSource.data = response.data;
                    this.totalItems = response.total;
                    this.loading = false;
                },
                error: (error) => {
                    console.error('Error al cargar historial:', error);
                    this.loading = false;
                }
            });
    }

    verDetalle(correo: HistorialCorreo): void {
        this.dialog.open(DetalleCorreoComponent, {
            width: '600px',
            data: correo
        });
    }

    marcarComoLeido(id: number): void {
        this.correoService.marcarComoLeido(id)
            .subscribe({
                next: () => {
                    this.cargarHistorial();
                },
                error: (error) => {
                    console.error('Error al marcar como leído:', error);
                }
            });
    }

    eliminarRegistro(id: number): void {
        if (confirm('¿Está seguro de eliminar este registro?')) {
            this.correoService.eliminarHistorial(id)
                .subscribe({
                    next: () => {
                        this.cargarHistorial();
                    },
                    error: (error) => {
                        console.error('Error al eliminar registro:', error);
                    }
                });
        }
    }

    limpiarFiltros(): void {
        this.filtroForm.reset();
        this.cargarHistorial(1);
    }

    onPageChange(event: any): void {
        this.pageSize = event.pageSize;
        this.cargarHistorial(event.pageIndex + 1);
    }

    // Helper para formatear fecha
    formatearFecha(fecha: Date): string {
        return new Date(fecha).toLocaleString('es-ES');
    }

    // Helper para estado
    obtenerEstado(enviado: boolean, error?: string): string {
        if (!enviado && error) {
            return 'Error';
        } else if (enviado) {
            return 'Enviado';
        } else {
            return 'Pendiente';
        }
    }
}